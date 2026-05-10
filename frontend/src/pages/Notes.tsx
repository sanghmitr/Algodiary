import { useCallback, useMemo, useState } from "react";
import type { Note } from "../types";
import { useNotes } from "../hooks/useNotes";
import { Button } from "../components/ui/button";
import { NoteEditor } from "../components/notes/NoteEditor";
import { NotesList } from "../components/notes/NotesList";

export function Notes() {
  const [search, setSearch] = useState("");
  const { notes, create, update } = useNotes(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => notes.data?.find((note) => note.id === selectedId) ?? notes.data?.[0] ?? null, [notes.data, selectedId]);
  const save = useCallback((payload: Partial<Note>) => {
    if (selected) update.mutate({ id: selected.id, payload });
  }, [selected, update]);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Notes</h1>
        <Button onClick={() => create.mutate({ title: "Untitled note", content: "", category: "DSA", tags: [] }, { onSuccess: (note) => setSelectedId(note.id) })}>New note</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <NotesList notes={notes.data ?? []} search={search} onSearch={setSearch} onSelect={(note) => setSelectedId(note.id)} />
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          {selected ? <NoteEditor note={selected} onSave={save} /> : <p className="text-sm text-slate-500">Create a note to start writing.</p>}
        </section>
      </div>
    </div>
  );
}

