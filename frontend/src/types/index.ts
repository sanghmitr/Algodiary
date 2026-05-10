export type Category = "DSA" | "HLD" | "LLD" | "General";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPhase = "foundation" | "advanced" | "simulation";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  target_companies: string[];
  target_date: string | null;
  daily_goal_hours: number;
  push_subscription: PushSubscriptionJSON | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface Task {
  id: string;
  user_id: string;
  day_number: number;
  phase: TaskPhase;
  week_number: number;
  dsa_topic: string | null;
  lc_problems: Array<{ title: string; url: string; difficulty: string }>;
  hld_topic: string | null;
  hld_resource_url: string | null;
  lld_topic: string | null;
  status: TaskStatus;
  kanban_order: number;
  time_allocation: Record<string, number>;
  notes_count: number;
  snippets_count: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  is_pinned: boolean;
  is_revision_ready: boolean;
  created_at: string;
  updated_at: string;
}

export interface Snippet {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  code: string;
  language: string;
  category: Category;
  description: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface KBItem {
  id: string;
  type: "note" | "snippet";
  title: string;
  category: Category;
  tags: string[];
  preview: string;
  code_preview: string | null;
  language: string | null;
  is_pinned: boolean | null;
  is_revision_ready: boolean | null;
  is_favorite: boolean | null;
  linked_task: { id: string; day_number: number; dsa_topic: string | null; hld_topic: string | null; lld_topic: string | null } | null;
  created_at: string;
  updated_at: string;
}

export interface KBSearchResponse {
  results: KBItem[];
  total: number;
  page: number;
  facets: {
    categories: Record<Category, number>;
    types: { note: number; snippet: number };
    top_tags: Array<{ tag: string; count: number }>;
  };
}

export interface KBStats {
  total_notes: number;
  total_snippets: number;
  by_category: Record<Category, number>;
  revision_ready_count: number;
  most_used_tags: Array<{ tag: string; count: number }>;
  recently_updated: KBItem[];
}

export interface DashboardStats {
  total_tasks_done: number;
  current_streak: number;
  avg_daily_score: number;
  days_remaining: number | null;
  problems_solved_this_week: number;
  total_notes: number;
  total_snippets: number;
  revision_ready_count: number;
}

export interface ProgressLog {
  id: string;
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

export interface WeakArea {
  id: string;
  category: Category;
  topic: string;
  severity: "weak" | "improving" | "fixed";
  identified_date: string;
  action_plan: string | null;
  updated_at: string;
}

export interface MockFeedback {
  id: string;
  mock_number: number;
  mock_date: string;
  company_target: string;
  dsa_score: number;
  hld_score: number;
  lld_score: number;
  behavioral_score: number;
  went_well: string | null;
  improvements: string | null;
  action_items: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "reminder" | "achievement" | "system";
  is_read: boolean;
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
}
