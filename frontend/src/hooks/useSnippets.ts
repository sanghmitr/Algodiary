import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/snippets";
import type { Snippet } from "../types";

export function useSnippets(search?: string) {
  const queryClient = useQueryClient();
  const snippets = useQuery({ queryKey: ["snippets", search], queryFn: () => api.listSnippets({ search }) });
  const create = useMutation({ mutationFn: api.createSnippet, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["snippets"] }) });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Snippet> }) => api.updateSnippet(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["snippets"] }),
  });
  return { snippets, create, update };
}

