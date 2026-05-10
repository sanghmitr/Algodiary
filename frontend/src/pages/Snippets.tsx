import { useCallback, useMemo, useState } from "react";
import type { Snippet } from "../types";
import { useSnippets } from "../hooks/useSnippets";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Sheet } from "../components/ui/sheet";
import { SnippetEditor } from "../components/snippets/SnippetEditor";
import { SnippetsList } from "../components/snippets/SnippetsList";

export function Snippets() {
  const [search, setSearch] = useState("");
  const { snippets, create, update } = useSnippets(search);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => snippets.data?.find((snippet) => snippet.id === selectedId) ?? null, [selectedId, snippets.data]);
  const save = useCallback((payload: Partial<Snippet>) => {
    if (selected) update.mutate({ id: selected.id, payload });
  }, [selected, update]);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Snippets</h1>
        <Button onClick={() => create.mutate({ title: "Untitled snippet", code: "", language: "Python", category: "DSA", description: "", tags: [] }, { onSuccess: (snippet) => setSelectedId(snippet.id) })}>New snippet</Button>
      </div>
      <Input placeholder="Search snippets" value={search} onChange={(event) => setSearch(event.target.value)} />
      <SnippetsList snippets={snippets.data ?? []} onSelect={(snippet) => setSelectedId(snippet.id)} />
      <Sheet open={Boolean(selected)} title={selected?.title ?? "Snippet"} onClose={() => setSelectedId(null)}>
        <SnippetEditor snippet={selected} onSave={save} />
      </Sheet>
    </div>
  );
}

