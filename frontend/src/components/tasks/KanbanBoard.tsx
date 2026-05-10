import { DragDropContext, type DropResult } from "react-beautiful-dnd";
import type { Task, TaskStatus } from "../../types";
import { KanbanColumn } from "./KanbanColumn";

const columns: Array<{ status: TaskStatus; title: string }> = [
  { status: "todo", title: "Todo" },
  { status: "in_progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

interface Props {
  tasks: Task[];
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
  onReorder: (items: Array<{ id: string; status: TaskStatus; kanban_order: number }>) => void;
}

export function KanbanBoard({ tasks, onOpen, onToggle, onReorder }: Props) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const moved = tasks.find((task) => task.id === result.draggableId);
    if (!moved) return;
    const targetStatus = result.destination.droppableId as TaskStatus;
    const updated = tasks
      .filter((task) => task.id !== moved.id)
      .filter((task) => task.status === targetStatus)
      .sort((a, b) => a.kanban_order - b.kanban_order);
    updated.splice(result.destination.index, 0, { ...moved, status: targetStatus });
    onReorder(updated.map((task, index) => ({ id: task.id, status: targetStatus, kanban_order: index })));
  };
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            tasks={tasks.filter((task) => task.status === column.status)}
            onOpen={onOpen}
            onToggle={onToggle}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
