import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSnippet } from "../api/snippets";
import type { Snippet } from "../types";
import { useSnippets } from "../hooks/useSnippets";
import { useTasks } from "../hooks/useTasks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { SnippetEditor } from "../components/snippets/SnippetEditor";
import { SnippetsList } from "../components/snippets/SnippetsList";

export function Snippets() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const taskId = searchParams.get("task_id");
  const snippetId = searchParams.get("snippet_id");
  const shouldCreate = searchParams.get("create") === "1";
  const [search, setSearch] = useState("");
  const { snippets, create, update, remove } = useSnippets(search, taskId, Boolean(taskId) || !snippetId);
  const { tasks } = useTasks();
  const snippetQuery = useQuery({ queryKey: ["snippet", snippetId], queryFn: () => getSnippet(snippetId ?? ""), enabled: Boolean(snippetId) });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const createdFromUrl = useRef(false);

  const selectedTask = useMemo(() => tasks.data?.find((task) => task.id === taskId) ?? null, [taskId, tasks.data]);
  const selected = useMemo(() => {
    if (snippetQuery.data) return snippetQuery.data;
    return snippets.data?.find((snippet) => snippet.id === selectedId) ?? snippets.data?.[0] ?? null;
  }, [snippetQuery.data, snippets.data, selectedId]);
  const fullPageEditor = Boolean(snippetId || taskId);

  const createSnippet = useCallback(() => {
    create.mutate(
      {
        title: "Untitled snippet",
        code: "",
        language: "Python",
        category: taskId ? undefined : "DSA",
        description: "",
        tags: [],
        task_id: taskId,
      },
      {
        onSuccess: (snippet) => {
          const params = taskId ? `task_id=${taskId}&snippet_id=${snippet.id}` : `snippet_id=${snippet.id}`;
          navigate(`/snippets?${params}`, { replace: fullPageEditor });
          setSelectedId(snippet.id);
        },
      },
    );
  }, [create, fullPageEditor, navigate, taskId]);

  useEffect(() => {
    if (!shouldCreate || !taskId || createdFromUrl.current) return;
    createdFromUrl.current = true;
    createSnippet();
  }, [createSnippet, shouldCreate, taskId]);

  const save = useCallback(async (payload: Partial<Snippet>) => {
    if (!selected) throw new Error("Choose a snippet before saving.");
    await update.mutateAsync({ id: selected.id, payload });
  }, [selected, update]);

  const deleteSelected = useCallback(() => {
    if (!selected || !window.confirm(`Delete snippet "${selected.title}"?`)) return;
    remove.mutate(selected.id, {
      onSuccess: () => {
        setSelectedId(null);
        navigate(taskId ? `/snippets?task_id=${taskId}` : "/snippets", { replace: true });
      },
    });
  }, [navigate, remove, selected, taskId]);

  if (fullPageEditor) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="icon" onClick={() => navigate(taskId ? "/tasks" : "/kb")} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Snippets</h1>
              <p className="text-sm text-slate-500">
                {selectedTask ? `Linked to Day ${selectedTask.day_number}.` : snippetId ? "Editing snippet." : "Code snippets for interview prep."}
              </p>
            </div>
          </div>
          <Button onClick={createSnippet} disabled={create.isPending}>
            New snippet
          </Button>
        </div>
        {taskId && (snippets.data?.length ?? 0) > 1 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <label className="text-xs font-semibold uppercase text-slate-500">Linked Snippets</label>
            <select
              className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
              value={selected?.id ?? ""}
              onChange={(event) => navigate(`/snippets?task_id=${taskId}&snippet_id=${event.target.value}`)}
            >
              {snippets.data?.map((snippet) => <option key={snippet.id} value={snippet.id}>{snippet.title}</option>)}
            </select>
          </div>
        ) : null}
        <section className="min-h-[calc(100vh-12rem)] rounded-lg border border-slate-200 bg-white p-4">
          {selected ? (
            <SnippetEditor snippet={selected} onSave={save} onDelete={deleteSelected} deleting={remove.isPending} taskOptions={tasks.data ?? []} fullHeight />
          ) : (
            <div className="flex min-h-[20rem] flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-slate-500">No snippet linked here yet.</p>
              <Button onClick={createSnippet} disabled={create.isPending}>Create snippet</Button>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Snippets</h1>
        <Button onClick={createSnippet} disabled={create.isPending}>New snippet</Button>
      </div>
      <Input placeholder="Search snippets" value={search} onChange={(event) => setSearch(event.target.value)} />
      <SnippetsList snippets={snippets.data ?? []} onSelect={(snippet) => navigate(`/snippets?snippet_id=${snippet.id}`)} />
    </div>
  );
}
