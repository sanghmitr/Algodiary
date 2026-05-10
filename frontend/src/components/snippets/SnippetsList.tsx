import type { Snippet } from "../../types";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";

interface Props {
  snippets: Snippet[];
  onSelect: (snippet: Snippet) => void;
}

export function SnippetsList({ snippets, onSelect }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {snippets.map((snippet) => (
        <button key={snippet.id} onClick={() => onSelect(snippet)} className="text-left">
          <Card className="h-full transition hover:border-brand-500">
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{snippet.title}</h2>
                <Badge tone="purple">{snippet.language}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{snippet.description}</p>
              <pre className="mt-3 overflow-hidden rounded-md bg-slate-950 p-3 text-xs text-slate-100">{snippet.code.split("\n").slice(0, 4).join("\n")}</pre>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

