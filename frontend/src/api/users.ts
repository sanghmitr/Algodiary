import { apiClient, getData } from "./client";
import type { DashboardStats, User } from "../types";

export function dashboardStats(): Promise<DashboardStats> {
  return getData<DashboardStats>("/users/me/stats");
}

export async function updateProfile(payload: Partial<Pick<User, "full_name" | "avatar_url" | "target_companies" | "target_date" | "daily_goal_hours">>): Promise<User> {
  const response = await apiClient.patch<User>("/users/me", payload);
  return response.data;
}

export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<User> {
  const response = await apiClient.post<User>("/users/me/push-sub", subscription);
  return response.data;
}

