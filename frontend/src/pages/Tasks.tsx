import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Category, Task, TaskStatus } from "../types";
import { useTasks } from "../hooks/useTasks";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { CustomTaskSheet } from "../components/tasks/CustomTaskSheet";
import { KanbanBoard } from "../components/tasks/KanbanBoard";
import { TaskModal } from "../components/tasks/TaskModal";

export function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, create, update, reorder } = useTasks();
  const [selected, setSelected] = useState<Task | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const initialStatus = searchParams.get("status");
  const initialCategory = searchParams.get("category");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(
    initialStatus === "todo" || initialStatus === "in_progress" || initialStatus === "done" ? initialStatus : "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">(
    initialCategory === "DSA" || initialCategory === "HLD" || initialCategory === "LLD" ? initialCategory : "all",
  );
  const [updatedFilter, setUpdatedFilter] = useState<"all" | "week">(searchParams.get("updated") === "week" ? "week" : "all");
  const [dayFilter, setDayFilter] = useState(searchParams.get("day") ?? "all");
  const [weekFilter, setWeekFilter] = useState(searchParams.get("week") ?? "all");
  const [monthFilter, setMonthFilter] = useState(searchParams.get("month") ?? "all");

  const allTasks = tasks.data ?? [];
  const days = useMemo(() => Array.from(new Set(allTasks.map((task) => task.day_number))).sort((a, b) => a - b), [allTasks]);
  const weeks = useMemo(() => Array.from(new Set(allTasks.map((task) => task.week_number))).sort((a, b) => a - b), [allTasks]);
  const months = useMemo(() => Array.from(new Set(allTasks.map((task) => Math.ceil(task.day_number / 30)))).sort((a, b) => a - b), [allTasks]);
  const nextDay = useMemo(() => Math.max(0, ...allTasks.map((task) => task.day_number)) + 1, [allTasks]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const weekAgo = new Date();
    weekAgo.setHours(0, 0, 0, 0);
    weekAgo.setDate(weekAgo.getDate() - 6);
    return allTasks.filter((task) => {
      const category = task.dsa_topic ? "DSA" : task.hld_topic ? "HLD" : task.lld_topic ? "LLD" : "General";
      const matchesSearch = !query || [task.dsa_topic, task.hld_topic, task.lld_topic].join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || category === categoryFilter;
      const matchesUpdated = updatedFilter === "all" || new Date(task.updated_at) >= weekAgo;
      const matchesDay = dayFilter === "all" || task.day_number === Number(dayFilter);
      const matchesWeek = weekFilter === "all" || task.week_number === Number(weekFilter);
      const matchesMonth = monthFilter === "all" || Math.ceil(task.day_number / 30) === Number(monthFilter);
      return matchesSearch && matchesStatus && matchesCategory && matchesUpdated && matchesDay && matchesWeek && matchesMonth;
    });
  }, [allTasks, categoryFilter, dayFilter, monthFilter, search, statusFilter, updatedFilter, weekFilter]);

  const updateFilterParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setUpdatedFilter("all");
    setDayFilter("all");
    setWeekFilter("all");
    setMonthFilter("all");
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-slate-500">Problem-level prep Kanban.</p>
        </div>
        <Button onClick={() => setCreatingTask(true)}>Create custom task</Button>
      </div>
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_9rem_9rem_9rem_9rem_9rem_9rem_auto]">
        <Input
          placeholder="Search by topic"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            updateFilterParams({ q: event.target.value });
          }}
        />
        <Select
          value={statusFilter}
          onChange={(event) => {
            const value = event.target.value as TaskStatus | "all";
            setStatusFilter(value);
            updateFilterParams({ status: value });
          }}
          aria-label="Filter by status"
        >
          <option value="all">All status</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </Select>
        <Select
          value={categoryFilter}
          onChange={(event) => {
            const value = event.target.value as Category | "all";
            setCategoryFilter(value);
            updateFilterParams({ category: value });
          }}
          aria-label="Filter by category"
        >
          <option value="all">All types</option>
          <option value="DSA">DSA</option>
          <option value="HLD">HLD</option>
          <option value="LLD">LLD</option>
        </Select>
        <Select
          value={updatedFilter}
          onChange={(event) => {
            const value = event.target.value as "all" | "week";
            setUpdatedFilter(value);
            updateFilterParams({ updated: value });
          }}
          aria-label="Filter by updated date"
        >
          <option value="all">Any time</option>
          <option value="week">This week</option>
        </Select>
        <Select value={dayFilter} onChange={(event) => { setDayFilter(event.target.value); updateFilterParams({ day: event.target.value }); }} aria-label="Filter by day">
          <option value="all">All days</option>
          {days.map((day) => (
            <option key={day} value={day}>
              Day {day}
            </option>
          ))}
        </Select>
        <Select value={weekFilter} onChange={(event) => { setWeekFilter(event.target.value); updateFilterParams({ week: event.target.value }); }} aria-label="Filter by week">
          <option value="all">All weeks</option>
          {weeks.map((week) => (
            <option key={week} value={week}>
              Week {week}
            </option>
          ))}
        </Select>
        <Select value={monthFilter} onChange={(event) => { setMonthFilter(event.target.value); updateFilterParams({ month: event.target.value }); }} aria-label="Filter by month">
          <option value="all">All months</option>
          {months.map((month) => (
            <option key={month} value={month}>
              Month {month}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={clearFilters}>
          Clear
        </Button>
      </div>
      {tasks.isLoading ? (
        <p>Loading tasks...</p>
      ) : (
        <KanbanBoard
          tasks={filtered}
          onOpen={setSelected}
          onToggle={(task) => {
            const nextStatus = task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";
            update.mutate({ id: task.id, payload: { status: nextStatus } });
          }}
          onReorder={(items) => reorder.mutate(items)}
        />
      )}
      <TaskModal task={selected} onClose={() => setSelected(null)} />
      <CustomTaskSheet
        open={creatingTask}
        initialDay={nextDay}
        creating={create.isPending}
        onClose={() => setCreatingTask(false)}
        onCreate={(payload) => create.mutate(payload, { onSuccess: () => setCreatingTask(false) })}
      />
    </div>
  );
}
