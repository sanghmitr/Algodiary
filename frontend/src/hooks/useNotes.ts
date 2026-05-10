import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/notes";
import type { Note } from "../types";

export function useNotes(search?: string) {
  const queryClient = useQueryClient();
  const notes = useQuery({ queryKey: ["notes", search], queryFn: () => api.listNotes({ search }) });
  const create = useMutation({ mutationFn: api.createNote, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }) });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Note> }) => api.updateNote(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });
  return { notes, create, update };
}

