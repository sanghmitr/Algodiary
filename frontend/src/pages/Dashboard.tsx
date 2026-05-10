import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { dashboardStats } from "../api/users";
import { listTasks } from "../api/tasks";
import { useProgress } from "../hooks/useProgress";
import type { Task } from "../types";
import { StatsCards } from "../components/dashboard/StatsCards";
import { ProgressChart } from "../components/dashboard/ProgressChart";
import { WeakAreasWidget } from "../components/dashboard/WeakAreasWidget";
import { TaskModal } from "../components/tasks/TaskModal";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export function Dashboard() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboardStats });
  const tasks = useQuery({ queryKey: ["tasks-upcoming"], queryFn: () => listTasks() });
  const progress = useProgress();
  if (stats.isLoading) return <p>Loading dashboard...</p>;
  if (!stats.data) return <p>Dashboard data is unavailable.</p>;
  const upcoming = (tasks.data ?? []).filter((task) => task.status !== "done").slice(0, 6);
  return (
    <div className="space-y-6">
      <StatsCards stats={stats.data} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <ProgressChart data={progress.summary.data ?? []} />
        <WeakAreasWidget areas={progress.weakAreas.data ?? []} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.9fr)]">
        <Card className="min-h-[22rem]">
          <CardHeader><h2 className="font-semibold">Upcoming tasks</h2></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {upcoming.map((task) => {
              const kind = task.dsa_topic ? "DSA" : task.hld_topic ? "HLD" : "LLD";
              const title = task.dsa_topic ?? task.hld_topic ?? task.lld_topic ?? "Prep task";
              const minutes = kind === "DSA" ? task.time_allocation.dsa ?? 0 : kind === "HLD" ? task.time_allocation.hld ?? 0 : task.time_allocation.lld ?? 0;
              return (
                <button
                  key={task.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-brand-500 hover:shadow-sm"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Day {task.day_number}</p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950">{title}</h3>
                    </div>
                    <Badge tone={kind === "DSA" ? "orange" : kind === "HLD" ? "teal" : "green"}>{kind}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{minutes}m</span>
                    <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{task.notes_count}</span>
                    <Badge>{task.phase}</Badge>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <Link to="/kb" className="rounded-lg border border-brand-100 bg-brand-50 p-5 text-slate-900 shadow-sm transition hover:border-brand-500">
            <BookOpen className="h-6 w-6 text-brand-600" />
            <h2 className="mt-4 text-lg font-semibold">Knowledge Base</h2>
            <p className="mt-2 text-sm text-slate-600">{stats.data.total_notes} notes, {stats.data.total_snippets} snippets, {stats.data.revision_ready_count} ready for revision.</p>
          </Link>
        </div>
      </div>
      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
