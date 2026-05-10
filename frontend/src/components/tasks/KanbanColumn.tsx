import { Droppable, Draggable } from "react-beautiful-dnd";
import type { Task, TaskStatus } from "../../types";
import { TaskCard } from "./TaskCard";

interface Props {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
}

export function KanbanColumn({ status, title, tasks, onOpen, onToggle }: Props) {
  return (
    <section className="min-h-[32rem] rounded-lg border border-slate-200 bg-slate-100 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">{tasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
            {tasks.map((task, index) => (
              <Draggable draggableId={task.id} index={index} key={task.id}>
                {(dragProvided) => (
                  <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                    <TaskCard task={task} onOpen={onOpen} onToggle={onToggle} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
}

