import { apiClient, getData } from "./client";
import type { MockFeedback, ProgressLog, WeakArea } from "../types";

export interface ProgressPayload {
  task_id: string | null;
  logged_date: string;
  dsa_score: number;
  hld_score: number;
  lld_score: number;
  behavioral_score: number;
  time_spent_minutes: number;
  problems_solved: number;
  mock_completed: boolean;
  notes: string | null;
}

export function listProgress(): Promise<ProgressLog[]> {
  return getData<ProgressLog[]>("/progress/");
}

export async function createProgress(payload: ProgressPayload): Promise<ProgressLog> {
  const response = await apiClient.post<ProgressLog>("/progress/", payload);
  return response.data;
}

export function progressSummary(): Promise<Array<Record<string, string | number>>> {
  return getData<Array<Record<string, string | number>>>("/progress/summary");
}

export function progressHeatmap(): Promise<Array<Record<string, string | number>>> {
  return getData<Array<Record<string, string | number>>>("/progress/heatmap");
}

export function weakAreas(): Promise<WeakArea[]> {
  return getData<WeakArea[]>("/progress/weak-areas");
}

export async function createWeakArea(payload: Pick<WeakArea, "category" | "topic" | "severity" | "action_plan">): Promise<WeakArea> {
  const response = await apiClient.post<WeakArea>("/progress/weak-areas", payload);
  return response.data;
}

export async function updateWeakArea(id: string, payload: Partial<Pick<WeakArea, "severity" | "action_plan">>): Promise<WeakArea> {
  const response = await apiClient.patch<WeakArea>(`/progress/weak-areas/${id}`, payload);
  return response.data;
}

export function mocks(): Promise<MockFeedback[]> {
  return getData<MockFeedback[]>("/progress/mocks");
}

export async function createMock(payload: Omit<MockFeedback, "id">): Promise<MockFeedback> {
  const response = await apiClient.post<MockFeedback>("/progress/mocks", payload);
  return response.data;
}
