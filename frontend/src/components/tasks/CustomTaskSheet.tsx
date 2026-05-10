import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { TaskPhase } from "../../types";
import type { TaskCreatePayload } from "../../api/tasks";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Sheet } from "../ui/sheet";

interface Props {
  open: boolean;
  initialDay: number;
  onClose: () => void;
  onCreate: (payload: TaskCreatePayload) => void;
  creating?: boolean;
}

type TaskCategory = TaskCreatePayload["category"];

const phases: TaskPhase[] = ["foundation", "advanced", "simulation"];
const categories: TaskCategory[] = ["DSA", "HLD", "LLD"];

function phaseForDay(day: number): TaskPhase {
  if (day <= 30) return "foundation";
  if (day <= 70) return "advanced";
  return "simulation";
}

export function CustomTaskSheet({ open, initialDay, onClose, onCreate, creating = false }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("DSA");
  const [dayNumber, setDayNumber] = useState(initialDay);
  const [weekNumber, setWeekNumber] = useState(Math.max(1, Math.ceil(initialDay / 7)));
  const [phase, setPhase] = useState<TaskPhase>(phaseForDay(initialDay));
  const [timeMinutes, setTimeMinutes] = useState(60);
  const [difficulty, setDifficulty] = useState("Medium");
  const [resourceUrl, setResourceUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setCategory("DSA");
    setDayNumber(initialDay);
    setWeekNumber(Math.max(1, Math.ceil(initialDay / 7)));
    setPhase(phaseForDay(initialDay));
    setTimeMinutes(60);
    setDifficulty("Medium");
    setResourceUrl("");
  }, [initialDay, open]);

  const submit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onCreate({
      title: trimmedTitle,
      category,
      day_number: dayNumber,
      week_number: weekNumber,
      phase,
      time_minutes: timeMinutes,
      difficulty: category === "DSA" ? difficulty : null,
      resource_url: resourceUrl.trim() || null,
    });
  };

  return (
    <Sheet open={open} title="Create custom task" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm text-slate-500">Add a one-off task to your Kanban. It starts in Todo and can be linked to notes or snippets like seeded tasks.</p>
        <label className="grid gap-1.5 text-sm font-medium">
          <span>Task title</span>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Design URL shortener, Review heaps..." autoFocus />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Category</span>
            <Select value={category} onChange={(event) => setCategory(event.target.value as TaskCategory)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Phase</span>
            <Select value={phase} onChange={(event) => setPhase(event.target.value as TaskPhase)}>
              {phases.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Day</span>
            <Input
              type="number"
              min={1}
              value={dayNumber}
              onChange={(event) => {
                const next = Math.max(1, Number(event.target.value));
                setDayNumber(next);
                setWeekNumber(Math.max(1, Math.ceil(next / 7)));
                setPhase(phaseForDay(next));
              }}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Week</span>
            <Input type="number" min={1} value={weekNumber} onChange={(event) => setWeekNumber(Math.max(1, Number(event.target.value)))} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Minutes</span>
            <Input type="number" min={0} step={15} value={timeMinutes} onChange={(event) => setTimeMinutes(Math.max(0, Number(event.target.value)))} />
          </label>
        </div>
        {category === "DSA" ? (
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Difficulty</span>
            <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              {["Easy", "Medium", "Hard"].map((item) => <option key={item}>{item}</option>)}
            </Select>
          </label>
        ) : null}
        <label className="grid gap-1.5 text-sm font-medium">
          <span>{category === "DSA" ? "Problem URL" : "Resource URL"}</span>
          <Input value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://..." />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button onClick={submit} disabled={!title.trim() || creating}>
            <Plus className="h-4 w-4" />
            {creating ? "Creating..." : "Create task"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Sheet>
  );
}
