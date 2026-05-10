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
  const kind = task.dsa_topic ? "DSA" : task.hld_topic ? "HLD" : "LLD";
  const title = task.dsa_topic ?? task.hld_topic ?? task.lld_topic ?? "Prep task";
  const minutes = kind === "DSA" ? task.time_allocation.dsa ?? 0 : kind === "HLD" ? task.time_allocation.hld ?? 0 : task.time_allocation.lld ?? 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Day {task.day_number}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone={task.phase === "foundation" ? "blue" : task.phase === "advanced" ? "purple" : "gold"}>{task.phase}</Badge>
            <Badge tone={kind === "DSA" ? "orange" : kind === "HLD" ? "teal" : "green"}>{kind}</Badge>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onToggle(task)}>
          {task.status === "todo" ? "Start" : task.status === "in_progress" ? "Done" : "Reopen"}
        </Button>
      </div>
      <button className="mt-3 block w-full text-left" onClick={() => onOpen(task)}>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {task.lc_problems[0]?.difficulty ? <p className="text-xs font-medium text-slate-500">{task.lc_problems[0].difficulty}</p> : null}
      </button>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><Code2 className="h-3 w-3" />{task.lc_problems.length}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{minutes}m</span>
        <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />{task.notes_count + task.snippets_count}</span>
      </div>
    </div>
  );
}
