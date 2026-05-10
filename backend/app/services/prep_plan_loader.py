from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

from app.models.task import TaskPhase


DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "90_Day_Prep_Plan.xlsx"
MAIN_SHEET_NAME = "90-Day Plan"
NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
URL_RE = re.compile(r"https?://\S+")


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
        title = line[: match.start()].strip(" -–—") if match else line
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
    return topic, url


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


def load_default_tasks() -> list[dict]:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"Default prep plan not found: {DATA_FILE}")

    with ZipFile(DATA_FILE) as workbook:
        shared = _shared_strings(workbook)
        sheet_path = _sheet_path(workbook, MAIN_SHEET_NAME)
        rows = _rows(workbook, sheet_path, shared)

    tasks: list[dict] = []
    # Rows 1-2 are title/metadata and row 3 is the header in the source workbook.
    for row in rows[3:]:
        if not row or not row[0].strip().isdigit():
            continue
        day = int(row[0])
        phase_week = row[1] if len(row) > 1 else ""
        hld_topic, hld_url = _topic_and_url(row[5] if len(row) > 5 else "")
        tasks.append(
            {
                "day_number": day,
                "phase": _phase(phase_week, day),
                "week_number": _week(phase_week, day),
                "dsa_topic": row[2] if len(row) > 2 else "",
                "lc_problems": _leetcode_problems(row[3] if len(row) > 3 else "", row[4] if len(row) > 4 else ""),
                "hld_topic": hld_topic,
                "hld_resource_url": hld_url,
                "lld_topic": row[6] if len(row) > 6 else "",
                "kanban_order": day,
                "time_allocation": _time_allocation(row[8] if len(row) > 8 else ""),
            }
        )
    if len(tasks) != 90:
        raise ValueError(f"Expected 90 prep days in workbook, found {len(tasks)}")
    return tasks
