import { Clock, Code2, FileText } from "lucide-react";
import type { Task } from "../../types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface Props {
  task: Task;
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
}

export function TaskCard({ task, onOpen, onToggle }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Day {task.day_number}</p>
          <Badge tone={task.phase === "foundation" ? "blue" : task.phase === "advanced" ? "purple" : "gold"}>{task.phase}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onToggle(task)}>
          {task.status === "done" ? "Reopen" : "Done"}
        </Button>
      </div>
      <button className="mt-3 block w-full text-left" onClick={() => onOpen(task)}>
        <p className="text-sm font-medium text-slate-900">{task.dsa_topic}</p>
        <p className="text-xs text-slate-500">{task.hld_topic}</p>
        <p className="text-xs text-slate-500">{task.lld_topic}</p>
      </button>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><Code2 className="h-3 w-3" />{task.lc_problems.length}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{Object.values(task.time_allocation).reduce((sum, value) => sum + value, 0)}m</span>
        <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{task.notes_count + task.snippets_count}</span>
      </div>
    </div>
  );
}

