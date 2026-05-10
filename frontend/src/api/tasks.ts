import { apiClient, getData } from "./client";
import type { Task, TaskPhase, TaskStatus } from "../types";

export interface TaskCreatePayload {
  title: string;
  category: "DSA" | "HLD" | "LLD";
  day_number: number;
  week_number: number;
  phase: TaskPhase;
  time_minutes: number;
  difficulty?: string | null;
  resource_url?: string | null;
}

export function listTasks(params?: { phase?: TaskPhase; week?: number; status?: TaskStatus; day?: number }): Promise<Task[]> {
  return getData<Task[]>("/tasks/", params);
}

export async function createTask(payload: TaskCreatePayload): Promise<Task> {
  const response = await apiClient.post<Task>("/tasks/", payload);
  return response.data;
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
