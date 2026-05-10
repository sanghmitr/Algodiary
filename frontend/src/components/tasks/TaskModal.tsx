import type { Task } from "../../types";
import { Badge } from "../ui/badge";
import { Sheet } from "../ui/sheet";

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: Props) {
  return (
    <Sheet open={Boolean(task)} title={task ? `Day ${task.day_number}` : "Task"} onClose={onClose}>
      {task ? (
        <div className="space-y-5">
          <div className="flex gap-2">
            <Badge tone="blue">{task.phase}</Badge>
            <Badge>{task.status}</Badge>
          </div>
          <section>
            <h3 className="font-semibold">DSA</h3>
            <p className="text-sm text-slate-600">{task.dsa_topic}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {task.lc_problems.map((problem) => (
                <li key={problem.title}>
                  <a className="text-brand-600" href={problem.url} target="_blank" rel="noreferrer">
                    {problem.title} · {problem.difficulty}
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold">HLD</h3>
            <p className="text-sm text-slate-600">{task.hld_topic}</p>
          </section>
          <section>
            <h3 className="font-semibold">LLD</h3>
            <p className="text-sm text-slate-600">{task.lld_topic}</p>
          </section>
          <p className="text-sm text-slate-500">{task.notes_count} notes and {task.snippets_count} snippets linked.</p>
        </div>
      ) : null}
    </Sheet>
  );
}

