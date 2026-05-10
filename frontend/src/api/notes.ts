import { apiClient, getData } from "./client";
import type { Category, Note } from "../types";

export type NotePayload = Partial<Pick<Note, "title" | "content" | "category" | "tags" | "is_pinned" | "is_revision_ready" | "task_id">>;

export function listNotes(params?: { task_id?: string; category?: Category; search?: string; revision_ready?: boolean }): Promise<Note[]> {
  return getData<Note[]>("/notes/", params);
}

export function getNote(id: string): Promise<Note> {
  return getData<Note>(`/notes/${id}`);
}

export async function createNote(payload: NotePayload): Promise<Note> {
  const response = await apiClient.post<Note>("/notes/", payload);
  return response.data;
}

export async function updateNote(id: string, payload: NotePayload): Promise<Note> {
  const response = await apiClient.patch<Note>(`/notes/${id}`, payload);
  return response.data;
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`);
}

export async function uploadNoteImage(noteId: string, file: File): Promise<{ url: string; filename: string; content_type: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<{ url: string; filename: string; content_type: string }>(`/notes/${noteId}/images`, formData);
  return response.data;
}

export async function deleteNoteImage(noteId: string, url: string): Promise<Note> {
  const response = await apiClient.delete<Note>(`/notes/${noteId}/images`, { data: { url } });
  return response.data;
}

export function noteTags(): Promise<string[]> {
  return getData<string[]>("/notes/tags/all");
}
