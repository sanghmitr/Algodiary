import { useMemo, useState } from "react";
import type { Task } from "../types";
import { useTasks } from "../hooks/useTasks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { KanbanBoard } from "../components/tasks/KanbanBoard";
import { TaskModal } from "../components/tasks/TaskModal";

export function Tasks() {
  const { tasks, update, reorder, seed } = useTasks();
  const [selected, setSelected] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => (tasks.data ?? []).filter((task) => [task.dsa_topic, task.hld_topic, task.lld_topic].join(" ").toLowerCase().includes(search.toLowerCase())), [search, tasks.data]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-slate-500">90-day prep Kanban.</p>
        </div>
        <Button onClick={() => seed.mutate()} disabled={seed.isPending}>Seed 90 days</Button>
      </div>
      <Input placeholder="Search by topic" value={search} onChange={(event) => setSearch(event.target.value)} />
      {tasks.isLoading ? <p>Loading tasks...</p> : <KanbanBoard tasks={filtered} onOpen={setSelected} onToggle={(task) => update.mutate({ id: task.id, payload: { status: task.status === "done" ? "todo" : "done" } })} onReorder={(items) => reorder.mutate(items)} />}
      <TaskModal task={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

