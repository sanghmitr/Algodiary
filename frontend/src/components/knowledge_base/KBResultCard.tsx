import { Copy, ExternalLink, Pencil, Star } from "lucide-react";
import type { KBItem } from "../../types";
import { highlight, relativeTime } from "../../utils/helpers";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface Props {
  item: KBItem;
  query: string;
  view: "grid" | "list";
  onOpen: (item: KBItem) => void;
}

const categoryTone = {
  DSA: "orange",
  HLD: "teal",
  LLD: "green",
  General: "slate",
} as const;

export function KBResultCard({ item, query, view, onOpen }: Props) {
  const topic = item.linked_task?.dsa_topic ?? item.linked_task?.hld_topic ?? item.linked_task?.lld_topic;
  return (
    <article className={`group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-500 ${view === "list" ? "flex flex-col gap-3" : ""}`}>
      <button className="w-full text-left" onClick={() => onOpen(item)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone={item.type === "note" ? "blue" : "purple"}>{item.type.toUpperCase()}</Badge>
            <Badge tone={categoryTone[item.category]}>{item.category}</Badge>
            {item.language ? <Badge>{item.language}</Badge> : null}
          </div>
          {item.is_revision_ready ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : null}
        </div>
        <h2 className="mt-3 text-base font-semibold" dangerouslySetInnerHTML={{ __html: highlight(item.title, query) }} />
        <p className="mt-2 line-clamp-3 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: highlight(item.preview || item.code_preview || "", query) }} />
        {item.code_preview ? <pre className="mt-3 overflow-hidden rounded-md bg-slate-950 p-3 text-xs text-slate-100">{item.code_preview}</pre> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>{item.linked_task ? `Day ${item.linked_task.day_number} — ${topic}` : "Unlinked"}</span>
          <span>{relativeTime(item.updated_at)}</span>
        </div>
      </button>
      <div className="mt-3 flex gap-2 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100">
        <Button size="sm" variant="secondary" onClick={() => onOpen(item)}><Pencil className="h-3 w-3" />Edit</Button>
        <Button size="sm" variant="ghost" onClick={() => onOpen(item)}><ExternalLink className="h-3 w-3" />Open</Button>
        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/kb?item=${item.id}`)}><Copy className="h-3 w-3" />Copy link</Button>
      </div>
    </article>
  );
}

