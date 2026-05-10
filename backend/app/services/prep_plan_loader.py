from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

from app.models.task import TaskPhase
from app.utils.text import clean_seed_content, clean_seed_label


DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "90_Day_Prep_Plan.xlsx"
MAIN_SHEET_NAME = "90-Day Plan"
NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
URL_RE = re.compile(r"https?://\S+")
SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")


DSA_RESOURCE_HINTS = {
    "neetcode",
    "leetcode",
    "kadane",
    "binary search",
    "monotonic",
    "floyd",
    "sliding",
    "subarray",
    "anagram",
    "two pointer",
    "two-pointer",
    "heap",
    "trie",
    "graph",
    "tree",
    "dp",
    "dynamic programming",
    "backtracking",
}
HLD_RESOURCE_HINTS = {
    "hellointerview",
    "system-design",
    "system design",
    "systemdesign",
    "donnemartin",
    "scalability",
    "load balancing",
    "database",
    "sharding",
    "replication",
    "indexing",
    "cap",
    "caching",
    "redis",
    "kafka",
    "queue",
    "api gateway",
    "grpc",
    "rest",
    "url shortener",
    "tinyurl",
    "cdn",
    "architecture",
    "rubric",
}
LLD_RESOURCE_HINTS = {
    "refactoring.guru",
    "factory",
    "singleton",
    "observer",
    "strategy",
    "builder",
    "pattern",
    "solid",
    "java",
    "oop",
    "class",
    "uml",
    "parking",
    "splitwise",
    "lru",
    "lfu",
}
HLD_ACTION_HINTS = {
    "hld",
    "whiteboard",
    "architecture",
    "schema",
    "sharding",
    "scale",
    "scaling",
    "load balancer",
    "cache",
    "caching",
    "kafka",
    "api",
    "url shortener",
    "feed",
    "system",
}
LLD_ACTION_HINTS = {
    "lld",
    "java",
    "class",
    "uml",
    "oop",
    "solid",
    "pattern",
    "singleton",
    "factory",
    "observer",
    "strategy",
    "builder",
    "parking",
    "splitwise",
}
DSA_ACTION_HINTS = {
    "dsa",
    "lc",
    "leetcode",
    "problem",
    "solve",
    "re-solve",
    "reattempt",
    "array",
    "subarray",
    "pointer",
    "stack",
    "binary",
    "graph",
    "dp",
}


def _column_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    index = 0
    for char in letters:
        index = index * 26 + ord(char.upper()) - 64
    return index - 1


def _shared_strings(workbook: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in workbook.namelist():
        return []
    root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
    values: list[str] = []
    for item in root.findall("a:si", NS):
        values.append("".join(text.text or "" for text in item.findall(".//a:t", NS)))
    return values


def _sheet_path(workbook: ZipFile, sheet_name: str) -> str:
    workbook_xml = ET.fromstring(workbook.read("xl/workbook.xml"))
    rels_xml = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    rels = {rel.attrib["Id"]: rel.attrib["Target"].lstrip("/") for rel in rels_xml}
    for sheet in workbook_xml.find("a:sheets", NS) or []:
        if sheet.attrib["name"] == sheet_name:
            rel_id = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            target = rels[rel_id]
            return target if target.startswith("xl/") else f"xl/{target}"
    raise ValueError(f"Sheet not found: {sheet_name}")


def _cell_text(cell: ET.Element, shared: list[str]) -> str:
    value = cell.find("a:v", NS)
    if value is not None:
        text = value.text or ""
        if cell.attrib.get("t") == "s":
            return shared[int(text)]
        return text
    inline = cell.find("a:is/a:t", NS)
    return inline.text if inline is not None and inline.text is not None else ""


def _rows(workbook: ZipFile, sheet_path: str, shared: list[str]) -> list[list[str]]:
    root = ET.fromstring(workbook.read(sheet_path))
    rows: list[list[str]] = []
    for row in root.findall(".//a:row", NS):
        cells: dict[int, str] = {}
        max_index = -1
        for cell in row.findall("a:c", NS):
            index = _column_index(cell.attrib["r"])
            max_index = max(max_index, index)
            cells[index] = _cell_text(cell, shared)
        rows.append([cells.get(index, "") for index in range(max_index + 1)])
    return rows


def _phase(value: str, day: int) -> TaskPhase:
    lowered = value.lower()
    if "phase 1" in lowered:
        return TaskPhase.foundation
    if "phase 2" in lowered:
        return TaskPhase.advanced
    if "phase 3" in lowered:
        return TaskPhase.simulation
    if day <= 30:
        return TaskPhase.foundation
    if day <= 70:
        return TaskPhase.advanced
    return TaskPhase.simulation


def _week(value: str, day: int) -> int:
    match = re.search(r"week\s+(\d+)", value, flags=re.IGNORECASE)
    return int(match.group(1)) if match else ((day - 1) // 7) + 1


def _difficulty(value: str) -> list[str]:
    mapping = {"E": "Easy", "M": "Medium", "H": "Hard"}
    tokens = re.split(r"[/,\s]+", value.strip())
    return [mapping.get(token.upper(), token) for token in tokens if token]


def _leetcode_problems(problem_cell: str, difficulty_cell: str) -> list[dict[str, str]]:
    difficulties = _difficulty(difficulty_cell)
    problems: list[dict[str, str]] = []
    for index, line in enumerate(problem_cell.splitlines()):
        line = line.strip()
        if not line:
            continue
        match = URL_RE.search(line)
        url = match.group(0) if match else ""
        title = clean_seed_label(line[: match.start()].strip(" -–—") if match else line)
        problems.append(
            {
                "title": title,
                "url": url,
                "difficulty": difficulties[index] if index < len(difficulties) else "",
            }
        )
    return problems


def _topic_and_url(value: str) -> tuple[str, str | None]:
    match = URL_RE.search(value)
    url = match.group(0) if match else None
    topic = URL_RE.sub("", value).strip()
    topic = re.sub(r"\s*\n\s*", " ", topic)
    return clean_seed_label(topic), url


def _minutes(part: str) -> int:
    match = re.search(r"(\d+(?:\.\d+)?)", part)
    if not match:
        return 0
    amount = float(match.group(1))
    return int(round(amount * 60)) if "h" in part.lower() else int(round(amount))


def _time_allocation(value: str) -> dict[str, int]:
    parts = [part.strip() for part in value.split("|")]
    while len(parts) < 3:
        parts.append("0")
    return {"dsa": _minutes(parts[0]), "hld": _minutes(parts[1]), "lld": _minutes(parts[2])}


def _sentences(value: str) -> list[str]:
    text = clean_seed_content(value)
    return [part.strip() for part in SENTENCE_RE.split(text) if part.strip()]


def _contains_any(value: str, hints: set[str]) -> bool:
    lowered = value.lower()
    return any(hint in lowered for hint in hints)


def _action_parts(actions: str) -> dict[str, str]:
    parts = _sentences(actions)
    if not parts:
        return {"DSA": "", "HLD": "", "LLD": ""}

    buckets: dict[str, list[str]] = {"DSA": [], "HLD": [], "LLD": []}
    for sentence in parts:
        lowered = sentence.lower()
        explicit_categories = {
            category
            for category, hints in {
                "DSA": DSA_ACTION_HINTS,
                "HLD": HLD_ACTION_HINTS,
                "LLD": LLD_ACTION_HINTS,
            }.items()
            if _contains_any(lowered, hints)
        }
        if {"DSA", "HLD", "LLD"}.issubset(explicit_categories):
            for category in buckets:
                buckets[category].append(sentence)
        elif "HLD" in explicit_categories and "LLD" not in explicit_categories:
            buckets["HLD"].append(sentence)
        elif "LLD" in explicit_categories and "HLD" not in explicit_categories:
            buckets["LLD"].append(sentence)
        elif "DSA" in explicit_categories:
            buckets["DSA"].append(sentence)

    if len(parts) >= 3:
        if not buckets["DSA"]:
            buckets["DSA"].append(parts[0])
        if not buckets["HLD"]:
            buckets["HLD"].append(parts[1])
        if not buckets["LLD"]:
            buckets["LLD"].append(parts[2])
    elif len(parts) == 2:
        if not buckets["DSA"]:
            buckets["DSA"].append(parts[0])
        if not buckets["HLD"]:
            buckets["HLD"].append(parts[1])
    elif not any(buckets.values()):
        buckets["DSA"].append(parts[0])

    return {category: " ".join(dict.fromkeys(items)) for category, items in buckets.items()}


def _keywords(*values: str) -> set[str]:
    keywords: set[str] = set()
    for value in values:
        for token in re.split(r"[^a-zA-Z0-9+#]+", value.lower()):
            if len(token) >= 4:
                keywords.add(token)
    return keywords


def _resource_score(line: str, category: str, *, dsa_topic: str, problems: list[dict[str, str]], hld_topic: str, lld_topic: str) -> int:
    lowered = line.lower()
    if category == "DSA":
        hints = DSA_RESOURCE_HINTS | _keywords(dsa_topic, *(problem.get("title", "") for problem in problems))
    elif category == "HLD":
        hints = HLD_RESOURCE_HINTS | _keywords(hld_topic)
    else:
        hints = LLD_RESOURCE_HINTS | _keywords(lld_topic)
    return sum(1 for hint in hints if hint and hint in lowered)


def _resource_parts(resources: str, *, dsa_topic: str, problems: list[dict[str, str]], hld_topic: str, lld_topic: str) -> dict[str, str]:
    buckets: dict[str, list[str]] = {"DSA": [], "HLD": [], "LLD": []}
    for raw_line in clean_seed_content(resources).splitlines():
        line = raw_line.strip()
        if not line:
            continue
        scores = {
            category: _resource_score(line, category, dsa_topic=dsa_topic, problems=problems, hld_topic=hld_topic, lld_topic=lld_topic)
            for category in buckets
        }
        best_category, best_score = max(scores.items(), key=lambda item: item[1])
        if best_score > 0:
            buckets[best_category].append(line)
    return {category: "\n".join(lines) for category, lines in buckets.items()}


def _focus_part(focus: str, category: str) -> str:
    text = clean_seed_content(focus)
    if not text:
        return ""
    lowered = text.lower()
    if category == "DSA":
        return text
    if category == "HLD" and _contains_any(lowered, HLD_ACTION_HINTS | {"rubric"}):
        return text
    if category == "LLD" and _contains_any(lowered, LLD_ACTION_HINTS):
        return text
    return ""


def _note_content(
    *,
    category: str,
    day: int,
    title: str,
    primary_topic: str,
    problem: dict[str, str] | None = None,
    hld_url: str | None,
    actions: str,
    resources: str,
    revision_flag: str,
    focus: str,
) -> str:
    primary_topic = clean_seed_label(primary_topic)
    actions = clean_seed_content(actions)
    resources = clean_seed_content(resources)
    revision_flag = clean_seed_content(revision_flag)
    lines = [
        f"**Category:** {category}",
        f"**Topic:** {primary_topic}",
    ]
    if problem:
        lines.append(f"**Difficulty:** {problem.get('difficulty') or 'Unspecified'}")
    if problem and problem.get("url"):
        lines.append(f"**LeetCode:** {problem['url']}")
    if hld_url:
        lines.append(f"**Resource:** {hld_url}")
    if category != "DSA" and actions:
        lines.extend(["", "## Actions", actions])
    if resources:
        lines.extend(["", "## Resources", resources])
    if revision_flag:
        lines.extend(["", "## Revision", revision_flag])
    lines.extend(["", "## Interview Focus", _focus_part(focus, category)])
    return "\n".join(lines)


def _starter_note(category: str, day: int, item_index: int, title: str, content: str, tags: list[str]) -> dict:
    return {
        "title": f"Day {day}.{item_index} - {clean_seed_label(title)}",
        "content": clean_seed_content(content),
        "category": category,
        "tags": [tag for tag in [clean_seed_label(tag) for tag in tags] if tag],
    }


def load_default_tasks() -> list[dict]:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Default prep plan not found: {DATA_FILE}")

    with ZipFile(DATA_FILE) as workbook:
        shared = _shared_strings(workbook)
        sheet_path = _sheet_path(workbook, MAIN_SHEET_NAME)
        rows = _rows(workbook, sheet_path, shared)

    tasks: list[dict] = []
    order = 0
    # Rows 1-2 are title/metadata and row 3 is the header in the source workbook.
    for row in rows[3:]:
        if not row or not row[0].strip().isdigit():
            continue
        day = int(row[0])
        phase_week = row[1] if len(row) > 1 else ""
        hld_topic, hld_url = _topic_and_url(row[5] if len(row) > 5 else "")
        pattern = clean_seed_label(row[2] if len(row) > 2 else "")
        lld_topic = clean_seed_label(row[6] if len(row) > 6 else "")
        actions = clean_seed_content(row[7] if len(row) > 7 else "")
        resources = clean_seed_content(row[9] if len(row) > 9 else "")
        revision_flag = clean_seed_content(row[10] if len(row) > 10 else "")
        focus = clean_seed_content(row[11] if len(row) > 11 else "")
        time_allocation = _time_allocation(row[8] if len(row) > 8 else "")
        problems = _leetcode_problems(row[3] if len(row) > 3 else "", row[4] if len(row) > 4 else "")
        if not problems:
            problems = [{"title": pattern or f"Day {day} prep task", "url": "", "difficulty": ""}]
        action_parts = _action_parts(actions)
        resource_parts = _resource_parts(resources, dsa_topic=pattern, problems=problems, hld_topic=hld_topic, lld_topic=lld_topic)

        for problem_index, problem in enumerate(problems, start=1):
            order += 1
            title = problem["title"] if problem["title"] else pattern
            content = _note_content(
                category="DSA",
                day=day,
                title=title,
                primary_topic=pattern,
                problem=problem,
                hld_url=None,
                actions=action_parts["DSA"],
                resources=resource_parts["DSA"],
                revision_flag=revision_flag,
                focus=focus,
            )
            tasks.append(
                {
                    "day_number": day,
                    "phase": _phase(phase_week, day),
                    "week_number": _week(phase_week, day),
                    "dsa_topic": title,
                    "lc_problems": [problem],
                    "hld_topic": None,
                    "hld_resource_url": None,
                    "lld_topic": None,
                    "kanban_order": order,
                    "time_allocation": {"dsa": time_allocation["dsa"], "hld": 0, "lld": 0},
                    "starter_note": _starter_note(
                        "DSA",
                        day,
                        problem_index,
                        title,
                        content,
                        [tag for tag in ["DSA", pattern, problem.get("difficulty", ""), f"day-{day}", f"week-{_week(phase_week, day)}"] if tag],
                    ),
                }
            )
        if hld_topic:
            order += 1
            content = _note_content(
                category="HLD",
                day=day,
                title=hld_topic,
                primary_topic=hld_topic,
                hld_url=hld_url,
                actions=action_parts["HLD"],
                resources=resource_parts["HLD"],
                revision_flag=revision_flag,
                focus=focus,
            )
            tasks.append(
                {
                    "day_number": day,
                    "phase": _phase(phase_week, day),
                    "week_number": _week(phase_week, day),
                    "dsa_topic": None,
                    "lc_problems": [],
                    "hld_topic": hld_topic,
                    "hld_resource_url": hld_url,
                    "lld_topic": None,
                    "kanban_order": order,
                    "time_allocation": {"dsa": 0, "hld": time_allocation["hld"], "lld": 0},
                    "starter_note": _starter_note(
                        "HLD",
                        day,
                        len(problems) + 1,
                        hld_topic,
                        content,
                        [tag for tag in ["HLD", f"day-{day}", f"week-{_week(phase_week, day)}"] if tag],
                    ),
                }
            )
        if lld_topic:
            order += 1
            content = _note_content(
                category="LLD",
                day=day,
                title=lld_topic,
                primary_topic=lld_topic,
                hld_url=None,
                actions=action_parts["LLD"],
                resources=resource_parts["LLD"],
                revision_flag=revision_flag,
                focus=focus,
            )
            tasks.append(
                {
                    "day_number": day,
                    "phase": _phase(phase_week, day),
                    "week_number": _week(phase_week, day),
                    "dsa_topic": None,
                    "lc_problems": [],
                    "hld_topic": None,
                    "hld_resource_url": None,
                    "lld_topic": lld_topic,
                    "kanban_order": order,
                    "time_allocation": {"dsa": 0, "hld": 0, "lld": time_allocation["lld"]},
                    "starter_note": _starter_note(
                        "LLD",
                        day,
                        len(problems) + 2,
                        lld_topic,
                        content,
                        [tag for tag in ["LLD", f"day-{day}", f"week-{_week(phase_week, day)}"] if tag],
                    ),
                }
            )
    if len(tasks) < 90:
        raise ValueError(f"Expected at least 90 prep tasks in workbook, found {len(tasks)}")
    return tasks
