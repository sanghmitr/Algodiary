import { useNavigate } from "react-router-dom";
import type { Task } from "../../types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Sheet } from "../ui/sheet";

interface Props {
  task: Task | null;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: Props) {
  const navigate = useNavigate();
  const kind = task?.dsa_topic ? "DSA" : task?.hld_topic ? "HLD" : "LLD";
  const title = task?.dsa_topic ?? task?.hld_topic ?? task?.lld_topic ?? "Prep task";
  const minutes = task ? (kind === "DSA" ? task.time_allocation.dsa ?? 0 : kind === "HLD" ? task.time_allocation.hld ?? 0 : task.time_allocation.lld ?? 0) : 0;
  return (
    <Sheet open={Boolean(task)} title={task ? `Day ${task.day_number}` : "Task"} onClose={onClose}>
      {task ? (
        <div className="space-y-5">
          <div className="flex gap-2">
            <Badge tone="blue">{task.phase}</Badge>
            <Badge tone={kind === "DSA" ? "orange" : kind === "HLD" ? "teal" : "green"}>{kind}</Badge>
            <Badge>{task.status}</Badge>
          </div>
          <section>
            <h3 className="font-semibold">{kind}</h3>
            <p className="text-sm text-slate-600">{title}</p>
            {task.lc_problems.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {task.lc_problems.map((problem) => (
                  <li key={problem.title}>
                    {problem.url ? (
                      <a className="text-brand-600" href={problem.url} target="_blank" rel="noreferrer">
                        {problem.title} · {problem.difficulty}
                      </a>
                    ) : (
                      <span>{problem.title} · {problem.difficulty}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            {task.hld_resource_url ? (
              <a className="mt-2 inline-block text-sm text-brand-600" href={task.hld_resource_url} target="_blank" rel="noreferrer">
                Open resource
              </a>
            ) : null}
          </section>
          <p className="text-sm text-slate-500">Planned time: {minutes}m</p>
          <p className="text-sm text-slate-500">{task.notes_count} notes and {task.snippets_count} snippets linked.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                onClose();
                navigate(`/notes?task_id=${task.id}`);
              }}
            >
              Open Associated Notes
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                navigate(`/snippets?task_id=${task.id}`);
              }}
            >
              Open Snippets
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                navigate(`/snippets?task_id=${task.id}&create=1`);
              }}
            >
              Create Snippet
            </Button>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
