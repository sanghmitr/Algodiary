import { getData } from "./client";
import type { Category, KBSearchResponse, KBStats } from "../types";

export interface KBFilters {
  q?: string;
  category?: Category | "all";
  type?: "note" | "snippet" | "all";
  tags?: string[];
  revision_ready?: boolean;
  sort?: "recent" | "alpha" | "relevance";
  page?: number;
  limit?: number;
}

export function searchKB(filters: KBFilters): Promise<KBSearchResponse> {
  return getData<KBSearchResponse>("/kb/search", {
    ...filters,
    tags: filters.tags?.join(","),
  });
}

export function getKBTags(): Promise<Array<{ tag: string; count: number; categories: Record<string, number> }>> {
  return getData<Array<{ tag: string; count: number; categories: Record<string, number> }>>("/kb/tags");
}

export function getKBStats(): Promise<KBStats> {
  return getData<KBStats>("/kb/stats");
}

