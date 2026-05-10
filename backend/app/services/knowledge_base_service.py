import hashlib
import json
from uuid import UUID
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.redis_client import get_redis
from app.services.text_cleanup_service import ensure_user_text_clean


DEFAULT_CATEGORY_COUNTS = {"DSA": 0, "HLD": 0, "LLD": 0, "General": 0}


def _stable_params(params: dict) -> str:
    return json.dumps(params, sort_keys=True, default=str, separators=(",", ":"))


def _filters(alias: str, params: dict, include_revision: bool) -> str:
    clauses = [f"{alias}.user_id = :user_id", f"{alias}.deleted_at IS NULL"]
    if params.get("category") and params["category"] != "all":
        clauses.append(f"{alias}.category = :category")
    if params.get("tags"):
        clauses.append(
            f"EXISTS (SELECT 1 FROM jsonb_array_elements_text({alias}.tags) AS tag(value) WHERE tag.value = ANY(CAST(:tags AS text[])))"
        )
    if include_revision and params.get("revision_ready") is not None:
        clauses.append(f"{alias}.is_revision_ready = :revision_ready")
    if params.get("q"):
        body = "content" if alias == "n" else "description"
        clauses.append(
            f"to_tsvector('english', coalesce({alias}.title,'') || ' ' || coalesce({alias}.{body},'')) @@ plainto_tsquery('english', :q)"
        )
    return " AND ".join(clauses)


def _row_to_item(row) -> dict:
    data = dict(row._mapping)
    linked_task = None
    if data.pop("task_id", None):
        linked_task = {
            "id": data.pop("linked_task_id"),
            "day_number": data.pop("day_number"),
            "dsa_topic": data.pop("dsa_topic"),
            "hld_topic": data.pop("hld_topic"),
            "lld_topic": data.pop("lld_topic"),
        }
    else:
        data.pop("linked_task_id", None)
        data.pop("day_number", None)
        data.pop("dsa_topic", None)
        data.pop("hld_topic", None)
        data.pop("lld_topic", None)
    data["linked_task"] = linked_task
    data.pop("rank", None)
    return data


async def search(
    db: AsyncSession,
    user_id: UUID,
    q: str | None,
    category: str,
    type_: str,
    tags: list[str],
    revision_ready: bool | None,
    sort: str | None,
    page: int,
    limit: int,
) -> dict:
    await ensure_user_text_clean(db, user_id)
    params = {
        "user_id": str(user_id),
        "q": q.strip() if q else None,
        "category": category,
        "type": type_,
        "tags": tags,
        "revision_ready": revision_ready,
        "sort": sort or ("relevance" if q else "recent"),
        "page": page,
        "limit": limit,
        "offset": (page - 1) * limit,
    }
    key = f"kb:{user_id}:{hashlib.sha256(_stable_params(params).encode()).hexdigest()}"
    redis = get_redis()
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)

    note_filter = _filters("n", params, True)
    snippet_filter = _filters("s", params, False)
    q_rank_note = "ts_rank(to_tsvector('english', coalesce(n.title,'') || ' ' || coalesce(n.content,'')), plainto_tsquery('english', :q))" if q else "0"
    q_rank_snippet = "ts_rank(to_tsvector('english', coalesce(s.title,'') || ' ' || coalesce(s.description,'')), plainto_tsquery('english', :q))" if q else "0"
    note_select = f"""
        SELECT n.id, 'note' AS type, n.title, n.category::text AS category, n.tags,
               left(n.content, 200) AS preview, NULL::text AS code_preview, NULL::text AS language,
               n.is_pinned, n.is_revision_ready, NULL::boolean AS is_favorite,
               n.task_id, t.id AS linked_task_id, t.day_number, t.dsa_topic, t.hld_topic, t.lld_topic,
               n.created_at, n.updated_at, {q_rank_note} AS rank
        FROM notes n LEFT JOIN tasks t ON t.id = n.task_id
        WHERE {note_filter}
    """
    snippet_select = f"""
        SELECT s.id, 'snippet' AS type, s.title, s.category::text AS category, s.tags,
               left(s.description, 200) AS preview, array_to_string((string_to_array(s.code, E'\\n'))[1:3], E'\\n') AS code_preview, s.language,
               NULL::boolean AS is_pinned, NULL::boolean AS is_revision_ready, s.is_favorite,
               s.task_id, t.id AS linked_task_id, t.day_number, t.dsa_topic, t.hld_topic, t.lld_topic,
               s.created_at, s.updated_at, {q_rank_snippet} AS rank
        FROM snippets s LEFT JOIN tasks t ON t.id = s.task_id
        WHERE {snippet_filter}
    """
    selects = []
    if type_ in ("all", "note"):
        selects.append(note_select)
    if type_ in ("all", "snippet") and revision_ready is not True:
        selects.append(snippet_select)
    if not selects:
        payload = {
            "results": [],
            "total": 0,
            "page": page,
            "facets": {"categories": DEFAULT_CATEGORY_COUNTS, "types": {"note": 0, "snippet": 0}, "top_tags": []},
        }
        await redis.set(key, json.dumps(payload, default=str), ex=60)
        return payload
    union_sql = " UNION ALL ".join(selects)
    order_clause = {
        "alpha": "title ASC",
        "relevance": "rank DESC, updated_at DESC",
        "recent": "updated_at DESC",
    }.get(params["sort"], "updated_at DESC")
    result_sql = text(f"WITH items AS ({union_sql}) SELECT * FROM items ORDER BY {order_clause} OFFSET :offset LIMIT :limit")
    count_sql = text(f"WITH items AS ({union_sql}) SELECT count(*) FROM items")
    facet_sql = text(
        f"""
        WITH items AS ({union_sql}),
        tag_counts AS (
            SELECT tag.value AS tag, count(*) AS count
            FROM items, jsonb_array_elements_text(items.tags) AS tag(value)
            GROUP BY tag.value ORDER BY count DESC, tag.value ASC LIMIT 20
        )
        SELECT
            coalesce((SELECT jsonb_object_agg(category, count) FROM (SELECT category, count(*) AS count FROM items GROUP BY category) c), '{{}}'::jsonb) AS categories,
            coalesce((SELECT jsonb_object_agg(type, count) FROM (SELECT type, count(*) AS count FROM items GROUP BY type) t), '{{}}'::jsonb) AS types,
            coalesce((SELECT jsonb_agg(jsonb_build_object('tag', tag, 'count', count)) FROM tag_counts), '[]'::jsonb) AS top_tags
        """
    )

    rows = (await db.execute(result_sql, params)).all()
    total = await db.scalar(count_sql, params) or 0
    facet_row = (await db.execute(facet_sql, params)).first()
    categories = DEFAULT_CATEGORY_COUNTS | (facet_row.categories if facet_row and facet_row.categories else {})
    types = {"note": 0, "snippet": 0} | (facet_row.types if facet_row and facet_row.types else {})
    payload = {
        "results": [_row_to_item(row) for row in rows],
        "total": total,
        "page": page,
        "facets": {"categories": categories, "types": types, "top_tags": facet_row.top_tags if facet_row and facet_row.top_tags else []},
    }
    await redis.set(key, json.dumps(payload, default=str), ex=60)
    return payload


async def get_all_tags(db: AsyncSession, user_id: UUID) -> list[dict]:
    await ensure_user_text_clean(db, user_id)
    rows = await db.execute(
        text(
            """
            WITH tags AS (
                SELECT n.category::text AS category, tag.value AS tag
                FROM notes n, jsonb_array_elements_text(n.tags) AS tag(value)
                WHERE n.user_id = :user_id AND n.deleted_at IS NULL
                UNION ALL
                SELECT s.category::text AS category, tag.value AS tag
                FROM snippets s, jsonb_array_elements_text(s.tags) AS tag(value)
                WHERE s.user_id = :user_id AND s.deleted_at IS NULL
            )
            SELECT tag, count(*) AS count,
                   jsonb_object_agg(category, category_count) AS categories
            FROM (
                SELECT tag, category, count(*) AS category_count
                FROM tags GROUP BY tag, category
            ) grouped
            GROUP BY tag ORDER BY count DESC, tag ASC
            """
        ),
        {"user_id": str(user_id)},
    )
    return [dict(row._mapping) for row in rows]


async def stats(db: AsyncSession, user_id: UUID) -> dict:
    recent = await search(db, user_id, None, "all", "all", [], None, "recent", 1, 5)
    row = (
        await db.execute(
            text(
                """
                SELECT
                    (SELECT count(*) FROM notes WHERE user_id=:user_id AND deleted_at IS NULL) AS total_notes,
                    (SELECT count(*) FROM snippets WHERE user_id=:user_id AND deleted_at IS NULL) AS total_snippets,
                    (SELECT count(*) FROM notes WHERE user_id=:user_id AND deleted_at IS NULL AND is_revision_ready) AS revision_ready_count,
                    coalesce((SELECT jsonb_object_agg(category, count) FROM (
                        SELECT category::text, count(*) FROM (
                            SELECT category FROM notes WHERE user_id=:user_id AND deleted_at IS NULL
                            UNION ALL SELECT category FROM snippets WHERE user_id=:user_id AND deleted_at IS NULL
                        ) x GROUP BY category
                    ) c), '{}'::jsonb) AS by_category
                """
            ),
            {"user_id": str(user_id)},
        )
    ).one()
    tags = await get_all_tags(db, user_id)
    return {
        "total_notes": row.total_notes,
        "total_snippets": row.total_snippets,
        "by_category": DEFAULT_CATEGORY_COUNTS | (row.by_category or {}),
        "revision_ready_count": row.revision_ready_count,
        "most_used_tags": [{"tag": item["tag"], "count": item["count"]} for item in tags[:10]],
        "recently_updated": recent["results"],
    }
