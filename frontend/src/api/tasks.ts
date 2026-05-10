import { apiClient, getData } from "./client";
import type { Task, TaskPhase, TaskStatus } from "../types";

export function listTasks(params?: { phase?: TaskPhase; week?: number; status?: TaskStatus; day?: number }): Promise<Task[]> {
  return getData<Task[]>("/tasks/", params);
}

export async function updateTask(id: string, payload: Partial<Pick<Task, "status" | "kanban_order">>): Promise<Task> {
  const response = await apiClient.patch<Task>(`/tasks/${id}`, payload);
  return response.data;
}

export async function reorderTasks(items: Array<{ id: string; status: TaskStatus; kanban_order: number }>): Promise<void> {
  await apiClient.patch("/tasks/reorder", { items });
}

export async function seedTasks(): Promise<Task[]> {
  const response = await apiClient.post<Task[]>("/tasks/seed");
  return response.data;
}

