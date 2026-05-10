import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getNote } from "../api/notes";
import type { Note } from "../types";
import { useNotes } from "../hooks/useNotes";
import { Button } from "../components/ui/button";
import { NoteEditor } from "../components/notes/NoteEditor";
import { NotesList } from "../components/notes/NotesList";

export function Notes() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const taskId = searchParams.get("task_id");
  const noteId = searchParams.get("note_id");
  const [search, setSearch] = useState("");
  const { notes, tags, create, update } = useNotes(search, taskId, !noteId);
  const noteQuery = useQuery({ queryKey: ["note", noteId], queryFn: () => getNote(noteId ?? ""), enabled: Boolean(noteId) });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => {
    if (noteQuery.data) return noteQuery.data;
    return notes.data?.find((note) => note.id === selectedId) ?? notes.data?.[0] ?? null;
  }, [noteQuery.data, notes.data, selectedId]);
  const fullPageEditor = Boolean(noteId || taskId);
  const save = useCallback(async (payload: Partial<Note>) => {
    if (!selected) throw new Error("Choose a note before saving.");
    await update.mutateAsync({ id: selected.id, payload });
  }, [selected, update]);

  if (fullPageEditor) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="icon" onClick={() => navigate(noteId ? "/kb" : "/tasks")} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Notes</h1>
              <p className="text-sm text-slate-500">{taskId ? "Showing notes linked to the selected task." : "Editing note."}</p>
            </div>
          </div>
          {taskId ? (
            <Button
              onClick={() =>
                create.mutate(
                  { title: "Untitled note", content: "", category: undefined, tags: [], task_id: taskId },
                  { onSuccess: (note) => setSelectedId(note.id) },
                )
              }
            >
              New note
            </Button>
          ) : null}
        </div>
        {taskId && (notes.data?.length ?? 0) > 1 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <label className="text-xs font-semibold uppercase text-slate-500">Linked Notes</label>
            <select className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>
              {notes.data?.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}
            </select>
          </div>
        ) : null}
        <section className="min-h-[calc(100vh-12rem)] rounded-lg border border-slate-200 bg-white p-4">
          {selected ? <NoteEditor note={selected} onSave={save} availableTags={tags.data ?? []} fullHeight /> : <p className="text-sm text-slate-500">Loading note...</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Notes</h1>
        <Button
          onClick={() =>
            create.mutate(
              { title: "Untitled note", content: "", category: taskId ? undefined : "DSA", tags: [], task_id: taskId },
              { onSuccess: (note) => setSelectedId(note.id) },
            )
          }
        >
          New note
        </Button>
      </div>
      {taskId ? <p className="text-sm text-slate-500">Showing notes linked to the selected task.</p> : null}
      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <NotesList notes={notes.data ?? []} search={search} onSearch={setSearch} onSelect={(note) => setSelectedId(note.id)} />
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          {selected ? <NoteEditor note={selected} onSave={save} availableTags={tags.data ?? []} /> : <p className="text-sm text-slate-500">Create a note to start writing.</p>}
        </section>
      </div>
    </div>
  );
}
