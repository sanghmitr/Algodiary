import { Star } from "lucide-react";
import type { Note } from "../../types";
import { Badge } from "../ui/badge";
import { relativeTime } from "../../utils/helpers";

interface Props {
  note: Note;
  onSelect: (note: Note) => void;
}

export function NoteCard({ note, onSelect }: Props) {
  return (
    <button className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-brand-500" onClick={() => onSelect(note)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{note.title}</p>
        </div>
        {note.is_revision_ready ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="orange">{note.category}</Badge>
        {note.tags.slice(0, 3).map((tag) => <Badge key={tag}>{tag}</Badge>)}
      </div>
      <p className="mt-2 text-xs text-slate-400">{relativeTime(note.updated_at)}</p>
    </button>
  );
}
