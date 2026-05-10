import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/snippets";
import type { Snippet } from "../types";

export function useSnippets(search?: string, taskId?: string | null, enabled = true) {
  const queryClient = useQueryClient();
  const snippets = useQuery({ queryKey: ["snippets", search, taskId], queryFn: () => api.listSnippets({ search, task_id: taskId ?? undefined }), enabled });
  const create = useMutation({
    mutationFn: api.createSnippet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["snippets"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks-upcoming"] });
      void queryClient.invalidateQueries({ queryKey: ["kb"] });
      void queryClient.invalidateQueries({ queryKey: ["kb-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Snippet> }) => api.updateSnippet(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["snippet", updated.id], updated);
      queryClient.setQueriesData<Snippet[]>({ queryKey: ["snippets"] }, (current) => current?.map((snippet) => (snippet.id === updated.id ? updated : snippet)));
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks-upcoming"] });
      void queryClient.invalidateQueries({ queryKey: ["kb"] });
      void queryClient.invalidateQueries({ queryKey: ["kb-stats"] });
    },
  });
  const remove = useMutation({
    mutationFn: api.deleteSnippet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["snippets"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks-upcoming"] });
      void queryClient.invalidateQueries({ queryKey: ["kb"] });
      void queryClient.invalidateQueries({ queryKey: ["kb-tags"] });
      void queryClient.invalidateQueries({ queryKey: ["kb-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
  return { snippets, create, update, remove };
}
