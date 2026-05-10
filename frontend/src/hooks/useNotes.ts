import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/notes";
import type { Note } from "../types";

export function useNotes(search?: string, taskId?: string | null, enabled = true) {
  const queryClient = useQueryClient();
  const notes = useQuery({ queryKey: ["notes", search, taskId], queryFn: () => api.listNotes({ search, task_id: taskId ?? undefined }), enabled });
  const tags = useQuery({ queryKey: ["note-tags"], queryFn: api.noteTags });
  const create = useMutation({
    mutationFn: api.createNote,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      void queryClient.invalidateQueries({ queryKey: ["note-tags"] });
      void queryClient.invalidateQueries({ queryKey: ["kb-tags"] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Note> }) => api.updateNote(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["note", updated.id], updated);
      queryClient.setQueriesData<Note[]>({ queryKey: ["notes"] }, (current) => current?.map((note) => (note.id === updated.id ? updated : note)));
      void queryClient.invalidateQueries({ queryKey: ["note-tags"] });
      void queryClient.invalidateQueries({ queryKey: ["kb-tags"] });
    },
  });
  return { notes, tags, create, update };
}
