import { Grid2X2, List } from "lucide-react";
import { Button } from "../ui/button";
import { Select } from "../ui/select";

interface Props {
  total: number;
  shown: number;
  sort: "recent" | "alpha" | "relevance";
  view: "grid" | "list";
  onSort: (value: "recent" | "alpha" | "relevance") => void;
  onView: (value: "grid" | "list") => void;
}

export function KBFilterBar({ total, shown, sort, view, onSort, onView }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">Showing {shown} of {total} items</p>
      <div className="flex items-center gap-2">
        <Select value={sort} onChange={(event) => onSort(event.target.value as "recent" | "alpha" | "relevance")}>
          <option value="recent">Most Recent</option>
          <option value="alpha">Alphabetical</option>
          <option value="relevance">Relevance</option>
        </Select>
        <Button variant={view === "grid" ? "primary" : "secondary"} size="icon" onClick={() => onView("grid")} aria-label="Grid view"><Grid2X2 className="h-4 w-4" /></Button>
        <Button variant={view === "list" ? "primary" : "secondary"} size="icon" onClick={() => onView("list")} aria-label="List view"><List className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

