import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/tasks";
import type { Task, TaskStatus } from "../types";

export function useTasks() {
  const queryClient = useQueryClient();
  const refreshTaskDependents = () => {
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    void queryClient.invalidateQueries({ queryKey: ["tasks-upcoming"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["progress-summary"] });
  };
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => api.listTasks() });
  const create = useMutation({ mutationFn: api.createTask, onSuccess: refreshTaskDependents });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Pick<Task, "status" | "kanban_order">> }) => api.updateTask(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["tasks-upcoming"] });
      const previous = queryClient.getQueryData<Task[]>(["tasks"]);
      const previousUpcoming = queryClient.getQueryData<Task[]>(["tasks-upcoming"]);
      queryClient.setQueryData<Task[]>(["tasks"], (current = []) => current.map((task) => (task.id === id ? { ...task, ...payload } : task)));
      queryClient.setQueryData<Task[]>(["tasks-upcoming"], (current = []) => current.map((task) => (task.id === id ? { ...task, ...payload } : task)));
      return { previous, previousUpcoming };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["tasks"], context.previous);
      if (context?.previousUpcoming) queryClient.setQueryData(["tasks-upcoming"], context.previousUpcoming);
    },
    onSuccess: refreshTaskDependents,
  });
  const reorder = useMutation({
    mutationFn: (items: Array<{ id: string; status: TaskStatus; kanban_order: number }>) => api.reorderTasks(items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["tasks-upcoming"] });
      const previous = queryClient.getQueryData<Task[]>(["tasks"]);
      const previousUpcoming = queryClient.getQueryData<Task[]>(["tasks-upcoming"]);
      const updates = new Map(items.map((item) => [item.id, item]));
      const applyUpdates = (current: Task[] = []) =>
        current.map((task) => {
          const update = updates.get(task.id);
          return update ? { ...task, status: update.status, kanban_order: update.kanban_order } : task;
        });
      queryClient.setQueryData<Task[]>(["tasks"], applyUpdates);
      queryClient.setQueryData<Task[]>(["tasks-upcoming"], applyUpdates);
      return { previous, previousUpcoming };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["tasks"], context.previous);
      if (context?.previousUpcoming) queryClient.setQueryData(["tasks-upcoming"], context.previousUpcoming);
    },
    onSuccess: refreshTaskDependents,
  });
  const seed = useMutation({ mutationFn: api.seedTasks, onSuccess: refreshTaskDependents });
  return { tasks, create, update, reorder, seed };
}
