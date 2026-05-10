import { apiClient } from "./client";
import type { AuthResponse, User } from "../types";

export async function register(payload: { email: string; full_name: string; password: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function refresh(): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/refresh");
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function me(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me");
  return response.data;
}

