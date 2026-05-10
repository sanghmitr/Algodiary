import { Link } from "react-router-dom";
import { Button } from "../ui/button";

interface Props {
  query: string;
  hasAnyItems: boolean;
  onClear: () => void;
}

export function KBEmptyState({ query, hasAnyItems, onClear }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold">{hasAnyItems ? `No results for '${query}'` : "Start adding notes to your tasks to build your knowledge base"}</h2>
      <p className="mt-2 text-sm text-slate-500">{hasAnyItems ? "Try different keywords or clear filters." : "Your polished notes and snippets will become your fastest revision loop."}</p>
      <div className="mt-5">
        {hasAnyItems ? (
          <Button onClick={onClear}>Clear filters</Button>
        ) : (
          <Link to="/notes">
            <Button>Open Notes</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
