import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { dashboardStats } from "../api/users";
import { listTasks } from "../api/tasks";
import { useProgress } from "../hooks/useProgress";
import { StatsCards } from "../components/dashboard/StatsCards";
import { ProgressChart } from "../components/dashboard/ProgressChart";
import { WeakAreasWidget } from "../components/dashboard/WeakAreasWidget";
import { MockScoreChart } from "../components/dashboard/MockScoreChart";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export function Dashboard() {
  const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboardStats });
  const tasks = useQuery({ queryKey: ["tasks-upcoming"], queryFn: () => listTasks() });
  const progress = useProgress();
  if (stats.isLoading) return <p>Loading dashboard...</p>;
  if (!stats.data) return <p>Dashboard data is unavailable.</p>;
  const upcoming = (tasks.data ?? []).filter((task) => task.status !== "done").slice(0, 3);
  return (
    <div className="space-y-6">
      <StatsCards stats={stats.data} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <ProgressChart data={progress.summary.data ?? []} />
        <WeakAreasWidget areas={progress.weakAreas.data ?? []} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><h2 className="font-semibold">Upcoming tasks</h2></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-3">
                <span className="text-sm">Day {task.day_number}: {task.dsa_topic}</span>
                <Badge>{task.phase}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <MockScoreChart mocks={progress.mocks.data ?? []} />
        <Link to="/kb" className="rounded-lg border border-brand-100 bg-brand-50 p-5 text-slate-900 shadow-sm transition hover:border-brand-500">
          <BookOpen className="h-6 w-6 text-brand-600" />
          <h2 className="mt-4 text-lg font-semibold">Knowledge Base</h2>
          <p className="mt-2 text-sm text-slate-600">{stats.data.total_notes} notes, {stats.data.total_snippets} snippets, {stats.data.revision_ready_count} ready for revision.</p>
        </Link>
      </div>
    </div>
  );
}

