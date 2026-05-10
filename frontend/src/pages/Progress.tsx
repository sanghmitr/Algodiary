import { useState } from "react";
import { Download } from "lucide-react";
import { useProgress } from "../hooks/useProgress";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input, Textarea } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { toCsv } from "../utils/helpers";

export function Progress() {
  const { logs, weakAreas, mocks, create } = useProgress();
  const [mockCompleted, setMockCompleted] = useState(false);
  const [notes, setNotes] = useState("");
  const submit = () => {
    create.mutate({
      logged_date: new Date().toISOString().slice(0, 10),
      task_id: null,
      dsa_score: 3,
      hld_score: 3,
      lld_score: 3,
      behavioral_score: 3,
      time_spent_minutes: 120,
      problems_solved: 2,
      mock_completed: mockCompleted,
      notes,
    });
  };
  const exportCsv = () => {
    const csv = toCsv((logs.data ?? []).map((log) => ({ date: log.logged_date, dsa: log.dsa_score, hld: log.hld_score, lld: log.lld_score, behavioral: log.behavioral_score, problems: log.problems_solved })));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "algodiary-progress.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
        <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader><h2 className="font-semibold">Daily log</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              {["DSA", "HLD", "LLD", "Behavioral"].map((label) => (
                <label key={label} className="text-sm font-medium">{label}<Input type="range" min="1" max="5" defaultValue="3" /></label>
              ))}
            </div>
            <Switch checked={mockCompleted} onCheckedChange={setMockCompleted} label="Mock completed" />
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Progress notes" />
            <Button onClick={submit}>Log today</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Summary</h2></CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>{logs.data?.length ?? 0} progress logs</p>
            <p>{weakAreas.data?.length ?? 0} weak areas</p>
            <p>{mocks.data?.length ?? 0} mock interviews</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

