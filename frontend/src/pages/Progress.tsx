import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { useProgress } from "../hooks/useProgress";
import type { Category, WeakArea } from "../types";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input, Textarea } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ProgressChart } from "../components/dashboard/ProgressChart";
import { toCsv } from "../utils/helpers";

type WeakAreaCategory = Extract<Category, "DSA" | "HLD" | "LLD">;

const categories: WeakAreaCategory[] = ["DSA", "HLD", "LLD"];
const severities: WeakArea["severity"][] = ["weak", "improving", "fixed"];

const severityTone = {
  weak: "red",
  improving: "gold",
  fixed: "green",
} as const;

const suggestedTopics: Record<WeakAreaCategory, string[]> = {
  DSA: ["Graphs", "Dynamic Programming", "Sliding Window", "Binary Search", "Trees"],
  HLD: ["Caching", "Rate limiting", "Database scaling", "Message queues", "Load balancing"],
  LLD: ["SOLID", "Design patterns", "Class design", "Interfaces", "Concurrency"],
};

export function Progress() {
  const { summary, weakAreas, createWeakArea, updateWeakArea } = useProgress();
  const [category, setCategory] = useState<WeakAreaCategory>("DSA");
  const [topic, setTopic] = useState("");
  const [severity, setSeverity] = useState<WeakArea["severity"]>("weak");
  const [actionPlan, setActionPlan] = useState("");

  const chartData = summary.data ?? [];
  const totalSolved = useMemo(() => chartData.reduce((total, item) => total + Number(item.problems_solved ?? 0), 0), [chartData]);
  const bestDay = useMemo(
    () => chartData.reduce<Record<string, string | number> | null>((best, item) => (Number(item.problems_solved ?? 0) > Number(best?.problems_solved ?? 0) ? item : best), null),
    [chartData],
  );

  const submitWeakArea = () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;
    createWeakArea.mutate(
      {
        category,
        topic: trimmedTopic,
        severity,
        action_plan: actionPlan.trim() || null,
      },
      {
        onSuccess: () => {
          setTopic("");
          setSeverity("weak");
          setActionPlan("");
        },
      },
    );
  };

  const exportCsv = () => {
    const csv = toCsv(chartData.map((item) => ({ date: item.date, problems_solved: item.problems_solved })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "algodiary-problems-solved.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="mt-1 text-sm text-slate-500">Track solved problems from completed DSA tasks and keep weak areas visible.</p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <ProgressChart data={chartData} />
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Summary</h2>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Problems solved</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{totalSolved}</p>
            </div>
            <div>
              <p className="text-slate-500">Best day</p>
              <p className="mt-1 font-medium text-slate-900">{bestDay ? `${bestDay.date} · ${bestDay.problems_solved} solved` : "No solved problems yet"}</p>
            </div>
            <div>
              <p className="text-slate-500">Open weak areas</p>
              <p className="mt-1 font-medium text-slate-900">{(weakAreas.data ?? []).filter((area) => area.severity !== "fixed").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Add weak area</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-1.5 text-sm font-medium">
                <span>Category</span>
                <Select value={category} onChange={(event) => setCategory(event.target.value as WeakAreaCategory)}>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                <span>Severity</span>
                <Select value={severity} onChange={(event) => setSeverity(event.target.value as WeakArea["severity"])}>
                  {severities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium">
              <span>Topic</span>
              <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Graphs, caching, SOLID..." />
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestedTopics[category].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-brand-100"
                  onClick={() => setTopic(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="grid gap-1.5 text-sm font-medium">
              <span>Action plan</span>
              <Textarea value={actionPlan} onChange={(event) => setActionPlan(event.target.value)} placeholder="What will you review or practice next?" />
            </label>
            <Button onClick={submitWeakArea} disabled={!topic.trim() || createWeakArea.isPending}>
              <Plus className="h-4 w-4" />
              Add weak area
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Weak areas</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakAreas.isLoading ? <p className="text-sm text-slate-500">Loading weak areas...</p> : null}
            {(weakAreas.data ?? []).map((area) => (
              <div key={area.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_11rem]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">{area.topic}</h3>
                    <Badge>{area.category}</Badge>
                    <Badge tone={severityTone[area.severity]}>{area.severity}</Badge>
                  </div>
                  {area.action_plan ? <p className="mt-2 text-sm text-slate-600">{area.action_plan}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">Identified {area.identified_date}</p>
                </div>
                <Select
                  value={area.severity}
                  onChange={(event) => updateWeakArea.mutate({ id: area.id, payload: { severity: event.target.value as WeakArea["severity"] } })}
                  aria-label={`Update ${area.topic} severity`}
                >
                  {severities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
            {!weakAreas.isLoading && !weakAreas.data?.length ? <p className="text-sm text-slate-500">No weak areas yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
