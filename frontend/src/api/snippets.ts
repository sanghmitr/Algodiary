import { apiClient, getData } from "./client";
import type { Category, Snippet } from "../types";

export type SnippetPayload = Partial<Pick<Snippet, "title" | "code" | "language" | "category" | "description" | "task_id" | "tags" | "is_favorite">>;

export function listSnippets(params?: { language?: string; task_id?: string; category?: Category; search?: string }): Promise<Snippet[]> {
  return getData<Snippet[]>("/snippets/", params);
}

export function getSnippet(id: string): Promise<Snippet> {
  return getData<Snippet>(`/snippets/${id}`);
}

export async function createSnippet(payload: SnippetPayload): Promise<Snippet> {
  const response = await apiClient.post<Snippet>("/snippets/", payload);
  return response.data;
}

export async function updateSnippet(id: string, payload: SnippetPayload): Promise<Snippet> {
  const response = await apiClient.patch<Snippet>(`/snippets/${id}`, payload);
  return response.data;
}

export async function deleteSnippet(id: string): Promise<void> {
  await apiClient.delete(`/snippets/${id}`);
}

export function snippetTags(): Promise<string[]> {
  return getData<string[]>("/snippets/tags/all");
}
