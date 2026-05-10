import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, Star, Timer } from "lucide-react";
import type { DashboardStats } from "../../types";
import { Card, CardContent } from "../ui/card";

interface Props {
  stats: DashboardStats;
}

export function StatsCards({ stats }: Props) {
  const cards = [
    { label: "Tasks done", value: stats.total_tasks_done, icon: CheckCircle2, to: "/tasks?status=done" },
    { label: "Problems this week", value: stats.problems_solved_this_week, icon: Timer, to: "/tasks?status=done&category=DSA&updated=week" },
    { label: "Days remaining", value: stats.days_remaining ?? "Set date", icon: CalendarDays, to: "/settings?section=interview-plan" },
    { label: "Notes", value: stats.total_notes, icon: BookOpen, to: "/kb?type=note" },
    { label: "Revision ready", value: stats.revision_ready_count, icon: Star, to: "/kb?type=note&revision_ready=1" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, to }) => (
        <Link key={label} to={to} className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
          <Card className="h-full transition hover:border-brand-500 hover:shadow-sm">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
              <Icon className="h-5 w-5 text-brand-600" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
