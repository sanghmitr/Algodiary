import { CalendarDays, CheckCircle2, Flame, Target, Timer } from "lucide-react";
import type { DashboardStats } from "../../types";
import { Card, CardContent } from "../ui/card";

interface Props {
  stats: DashboardStats;
}

export function StatsCards({ stats }: Props) {
  const cards = [
    { label: "Tasks done", value: stats.total_tasks_done, icon: CheckCircle2 },
    { label: "Current streak", value: `${stats.current_streak} days`, icon: Flame },
    { label: "Avg daily score", value: stats.avg_daily_score.toFixed(1), icon: Target },
    { label: "Days remaining", value: stats.days_remaining ?? "Set date", icon: CalendarDays },
    { label: "Problems this week", value: stats.problems_solved_this_week, icon: Timer },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </div>
            <Icon className="h-5 w-5 text-brand-600" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

