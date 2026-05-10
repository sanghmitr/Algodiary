import type { Note } from "../../types";
import { Input } from "../ui/input";
import { NoteCard } from "./NoteCard";

interface Props {
  notes: Note[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (note: Note) => void;
}

export function NotesList({ notes, search, onSearch, onSelect }: Props) {
  return (
    <aside className="space-y-3">
      <Input placeholder="Search notes" value={search} onChange={(event) => onSearch(event.target.value)} />
      <div className="space-y-3">
        {notes.map((note) => <NoteCard key={note.id} note={note} onSelect={onSelect} />)}
        {!notes.length ? <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No notes yet.</p> : null}
      </div>
    </aside>
  );
}

