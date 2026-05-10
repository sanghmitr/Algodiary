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
    const sourceStatus = result.source.droppableId as TaskStatus;
    const targetStatus = result.destination.droppableId as TaskStatus;
    const byStatus = (status: TaskStatus) => tasks.filter((task) => task.status === status).sort((a, b) => a.kanban_order - b.kanban_order);
    const sourceItems = byStatus(sourceStatus).filter((task) => task.id !== moved.id);
    const destinationItems = sourceStatus === targetStatus ? sourceItems : byStatus(targetStatus).filter((task) => task.id !== moved.id);
    destinationItems.splice(result.destination.index, 0, { ...moved, status: targetStatus });
    if (sourceStatus === targetStatus) {
      onReorder(destinationItems.map((task, index) => ({ id: task.id, status: targetStatus, kanban_order: index })));
      return;
    }
    onReorder([
      ...sourceItems.map((task, index) => ({ id: task.id, status: sourceStatus, kanban_order: index })),
      ...destinationItems.map((task, index) => ({ id: task.id, status: targetStatus, kanban_order: index })),
    ]);
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
