import { X } from "lucide-react";
import { Badge } from "../ui/badge";

interface Props {
  tags: Array<{ tag: string; count: number }>;
  activeTags: string[];
  onToggle: (tag: string) => void;
}

export function KBTagCloud({ tags, activeTags, onToggle }: Props) {
  const max = Math.max(...tags.map((tag) => tag.count), 1);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {activeTags.map((tag) => (
          <button key={tag} onClick={() => onToggle(tag)}>
            <Badge tone="green">{tag}<X className="ml-1 h-3 w-3" /></Badge>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.slice(0, 30).map((item) => {
          const size = item.count > max * 0.66 ? "text-sm" : item.count > max * 0.33 ? "text-xs" : "text-[11px]";
          return (
            <button key={item.tag} className={`${size} rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-brand-100`} onClick={() => onToggle(item.tag)}>
              {item.tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

