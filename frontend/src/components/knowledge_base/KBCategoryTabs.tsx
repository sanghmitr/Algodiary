import type { Category } from "../../types";
import { cn } from "../../utils/helpers";

interface Props {
  value: Category | "all";
  counts: Record<Category, number>;
  onChange: (value: Category | "all") => void;
}

export function KBCategoryTabs({ value, counts, onChange }: Props) {
  const items: Array<Category | "all"> = ["all", "DSA", "HLD", "LLD", "General"];
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium", value === item ? "bg-slate-900 text-white" : "hover:bg-slate-100")}
        >
          <span>{item === "all" ? "All" : item}</span>
          <span className="rounded-full bg-white/20 px-2 text-xs">{item === "all" ? Object.values(counts).reduce((sum, count) => sum + count, 0) : counts[item]}</span>
        </button>
      ))}
    </div>
  );
}

