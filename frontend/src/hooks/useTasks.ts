import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/tasks";
import type { Task, TaskStatus } from "../types";

export function useTasks() {
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => api.listTasks() });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Pick<Task, "status" | "kanban_order">> }) => api.updateTask(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const reorder = useMutation({
    mutationFn: (items: Array<{ id: string; status: TaskStatus; kanban_order: number }>) => api.reorderTasks(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const seed = useMutation({ mutationFn: api.seedTasks, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }) });
  return { tasks, update, reorder, seed };
}

