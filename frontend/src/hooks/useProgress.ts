import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/progress";

export function useProgress() {
  const queryClient = useQueryClient();
  const logs = useQuery({ queryKey: ["progress"], queryFn: api.listProgress });
  const summary = useQuery({ queryKey: ["progress-summary"], queryFn: api.progressSummary });
  const weakAreas = useQuery({ queryKey: ["weak-areas"], queryFn: api.weakAreas });
  const mocks = useQuery({ queryKey: ["mocks"], queryFn: api.mocks });
  const create = useMutation({ mutationFn: api.createProgress, onSuccess: () => queryClient.invalidateQueries() });
  const createWeakArea = useMutation({ mutationFn: api.createWeakArea, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weak-areas"] }) });
  const updateWeakArea = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof api.updateWeakArea>[1] }) => api.updateWeakArea(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weak-areas"] }),
  });
  return { logs, summary, weakAreas, mocks, create, createWeakArea, updateWeakArea };
}
