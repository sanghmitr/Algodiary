import { useCallback, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useInView } from "react-intersection-observer";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Category, KBItem } from "../types";
import { useKnowledgeBase } from "../hooks/useKnowledgeBase";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { KBCategoryTabs } from "../components/knowledge_base/KBCategoryTabs";
import { KBEmptyState } from "../components/knowledge_base/KBEmptyState";
import { KBFilterBar } from "../components/knowledge_base/KBFilterBar";
import { KBResultCard } from "../components/knowledge_base/KBResultCard";
import { KBSearchBar } from "../components/knowledge_base/KBSearchBar";
import { KBTagCloud } from "../components/knowledge_base/KBTagCloud";

export function KnowledgeBase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");
  const initialType = searchParams.get("type");
  const initialSort = searchParams.get("sort");
  const initialView = searchParams.get("view");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState<Category | "all">(
    initialCategory === "DSA" || initialCategory === "HLD" || initialCategory === "LLD" || initialCategory === "General" ? initialCategory : "all",
  );
  const [type, setType] = useState<"all" | "note" | "snippet">(initialType === "note" || initialType === "snippet" ? initialType : "all");
  const [activeTags, setActiveTags] = useState<string[]>(searchParams.get("tags")?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? []);
  const [revisionReady, setRevisionReady] = useState(searchParams.get("revision_ready") === "1" || searchParams.get("revision_ready") === "true");
  const [sort, setSort] = useState<"recent" | "alpha" | "relevance">(initialSort === "alpha" || initialSort === "relevance" ? initialSort : "recent");
  const [view, setView] = useState<"grid" | "list">(initialView === "list" ? "list" : "grid");
  const { ref, inView } = useInView({ rootMargin: "320px" });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const kb = useKnowledgeBase({ q: debounced, category, type, tags: activeTags, revision_ready: revisionReady ? true : undefined, sort });

  useEffect(() => {
    if (inView && kb.hasNextPage && !kb.isFetchingNextPage) void kb.fetchNextPage();
  }, [inView, kb.fetchNextPage, kb.hasNextPage, kb.isFetchingNextPage]);

  useHotkeys("/", (event) => {
    event.preventDefault();
    document.getElementById("kb-search")?.focus();
  });
  useHotkeys("esc", () => {
    setSearch("");
  });

  const toggleTag = (tag: string) => setActiveTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  const clear = () => {
    setSearch("");
    setDebounced("");
    setCategory("all");
    setType("all");
    setActiveTags([]);
    setRevisionReady(false);
  };
  const counts = kb.facets?.categories ?? { DSA: 0, HLD: 0, LLD: 0, General: 0 };
  const stats = kb.stats.data;
  const tags = useMemo(() => kb.tags.data ?? kb.facets?.top_tags ?? [], [kb.facets?.top_tags, kb.tags.data]);
  const openItem = useCallback((item: KBItem) => {
    if (item.type === "note") {
      navigate(`/notes?note_id=${item.id}`);
      return;
    }
    navigate(`/snippets?snippet_id=${item.id}`);
  }, [navigate]);

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <aside className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 xl:sticky xl:top-0 xl:max-h-[calc(100vh-8rem)] xl:overflow-auto">
        <KBCategoryTabs value={category} counts={counts} onChange={setCategory} />
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Type</p>
          <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1">
            {(["all", "note", "snippet"] as const).map((item) => (
              <button key={item} className={`rounded px-2 py-1 text-xs font-semibold ${type === item ? "bg-white shadow-sm" : ""}`} onClick={() => setType(item)}>{item}</button>
            ))}
          </div>
        </div>
        <Switch checked={revisionReady} onCheckedChange={setRevisionReady} label="Revision Ready only" />
        <section>
          <p className="mb-3 text-xs font-semibold uppercase text-slate-500">Tag Cloud</p>
          <KBTagCloud tags={tags} activeTags={activeTags} onToggle={toggleTag} />
        </section>
        <section className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <div className="flex justify-between"><span>Notes</span><strong>{stats?.total_notes ?? 0}</strong></div>
          <div className="flex justify-between"><span>Snippets</span><strong>{stats?.total_snippets ?? 0}</strong></div>
          <div className="flex justify-between"><span>Revision ready</span><strong>{stats?.revision_ready_count ?? 0}</strong></div>
          <p className="mt-2 text-xs">Last updated: {stats?.recently_updated[0]?.updated_at ? new Date(stats.recently_updated[0].updated_at).toLocaleDateString() : "Never"}</p>
        </section>
      </aside>
      <section className="space-y-4">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <KBSearchBar value={search} onChange={setSearch} />
          <KBFilterBar total={kb.total} shown={kb.items.length} sort={sort} view={view} onSort={setSort} onView={setView} />
          <div className="flex flex-wrap gap-2">
            {activeTags.map((tag) => <Badge key={tag} tone="green">{tag}</Badge>)}
          </div>
        </div>
        {kb.isLoading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-44 animate-pulse rounded-lg bg-slate-200" /><div className="h-44 animate-pulse rounded-lg bg-slate-200" /></div> : null}
        {!kb.isLoading && !kb.items.length ? <KBEmptyState query={search} hasAnyItems={Boolean((stats?.total_notes ?? 0) + (stats?.total_snippets ?? 0))} onClear={clear} /> : null}
        <div className={view === "grid" ? "grid gap-4 md:grid-cols-2 2xl:grid-cols-3" : "space-y-4"}>
          {kb.items.map((item) => <KBResultCard key={`${item.type}-${item.id}`} item={item} query={debounced} view={view} onOpen={openItem} />)}
        </div>
        <div ref={ref} className="h-8" />
        {kb.isFetchingNextPage ? <p className="text-center text-sm text-slate-500">Loading more...</p> : null}
      </section>
    </div>
  );
}
