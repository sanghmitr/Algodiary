import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

interface Props {
  tags: Array<{ tag: string; count: number }>;
  activeTags: string[];
  onToggle: (tag: string) => void;
}

function isGeneratedScheduleTag(tag: string): boolean {
  return /^(day|week)-\d+$/i.test(tag.trim());
}

export function KBTagCloud({ tags, activeTags, onToggle }: Props) {
  const [search, setSearch] = useState("");
  const filteredTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tags.filter((item) => {
      const matchesSearch = !query || item.tag.toLowerCase().includes(query);
      return matchesSearch && (query ? true : !isGeneratedScheduleTag(item.tag));
    });
  }, [search, tags]);
  const max = Math.max(...filteredTags.map((tag) => tag.count), 1);
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tags" />
      </div>
      <div className="flex flex-wrap gap-2">
        {activeTags.map((tag) => (
          <button key={tag} onClick={() => onToggle(tag)}>
            <Badge tone="green">{tag}<X className="ml-1 h-3 w-3" /></Badge>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {filteredTags.slice(0, 30).map((item) => {
          const size = item.count > max * 0.66 ? "text-sm" : item.count > max * 0.33 ? "text-xs" : "text-[11px]";
          return (
            <button key={item.tag} className={`${size} rounded-full bg-slate-100 px-3 py-1 text-slate-700 hover:bg-brand-100`} onClick={() => onToggle(item.tag)}>
              {item.tag}
            </button>
          );
        })}
        {search.trim() && !filteredTags.length ? <p className="text-sm text-slate-500">No tags found.</p> : null}
        {!search.trim() && !filteredTags.length ? <p className="text-sm text-slate-500">No topic tags yet.</p> : null}
      </div>
    </div>
  );
}
