import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { AlertCircle, CheckCircle2, Copy, Save, Star, Trash2 } from "lucide-react";
import type { Category, Snippet, Task } from "../../types";
import { CATEGORIES } from "../../utils/constants";
import { Button } from "../ui/button";
import { Input, Textarea } from "../ui/input";
import { Select } from "../ui/select";
import { Switch } from "../ui/switch";
import { LanguageSelector } from "./LanguageSelector";

interface Props {
  snippet: Snippet | null;
  onSave: (payload: Partial<Snippet>) => Promise<void> | void;
  onDelete?: () => void;
  deleting?: boolean;
  taskOptions?: Task[];
  fullHeight?: boolean;
}

function taskLabel(task: Task): string {
  const title = task.dsa_topic ?? task.hld_topic ?? task.lld_topic ?? "Prep task";
  return `Day ${task.day_number} - ${title}`;
}

function TaskSearchPicker({ value, tasks, onChange }: { value: string | null | undefined; tasks: Task[]; onChange: (taskId: string | null) => void }) {
  const selectedTask = tasks.find((task) => task.id === value);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setQuery(selectedTask ? taskLabel(selectedTask) : "");
  }, [selectedTask]);

  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks
      .filter((task) => {
        if (!normalized) return true;
        const haystack = `${taskLabel(task)} ${task.phase} ${task.week_number}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 8);
  }, [query, tasks]);

  return (
    <div className="relative">
      <Input
        value={query}
        placeholder="Search linked task"
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value);
          if (!event.target.value.trim()) onChange(null);
        }}
      />
      {focused ? (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          <button type="button" className="w-full rounded px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50" onMouseDown={() => onChange(null)}>
            No linked task
          </button>
          {matches.map((task) => (
            <button
              key={task.id}
              type="button"
              className="w-full rounded px-3 py-2 text-left text-sm hover:bg-brand-50"
              onMouseDown={() => {
                onChange(task.id);
                setQuery(taskLabel(task));
              }}
            >
              <span className="font-medium text-slate-900">{taskLabel(task)}</span>
              <span className="ml-2 text-xs text-slate-500">Week {task.week_number}</span>
            </button>
          ))}
          {!matches.length ? <p className="px-3 py-2 text-sm text-slate-500">No matching tasks.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function SnippetEditor({ snippet, onSave, onDelete, deleting = false, taskOptions = [], fullHeight = false }: Props) {
  const [draft, setDraft] = useState<Partial<Snippet>>({ title: "", code: "", language: "Python", category: "DSA", description: "", tags: [], is_favorite: false });
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (snippet) setDraft(snippet);
  }, [snippet]);

  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  const extension = useMemo(() => {
    if (draft.language === "C" || draft.language === "C++") return java();
    if (draft.language === "Java") return java();
    if (draft.language === "JavaScript" || draft.language === "TypeScript") return javascript({ typescript: draft.language === "TypeScript" });
    if (draft.language === "SQL") return sql();
    return python();
  }, [draft.language]);

  const validateDraft = () => {
    if (!(draft.title ?? "").trim()) {
      setSaveNotice({ type: "error", message: "Add a snippet title before saving." });
      titleInputRef.current?.focus();
      return false;
    }
    if (!draft.category) {
      setSaveNotice({ type: "error", message: "Choose a category before saving." });
      return false;
    }
    if (!draft.language) {
      setSaveNotice({ type: "error", message: "Choose a language before saving." });
      return false;
    }
    if (!(draft.code ?? "").trim()) {
      setSaveNotice({ type: "error", message: "Add code before saving the snippet." });
      return false;
    }
    return true;
  };

  const saveManually = async () => {
    if (!validateDraft()) return;
    setSaving(true);
    setSaveNotice(null);
    try {
      await onSave(draft);
      setSaveNotice({ type: "success", message: "Snippet saved." });
    } catch (error) {
      setSaveNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to save snippet." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {saveNotice ? (
        <div
          role={saveNotice.type === "success" ? "status" : "alert"}
          className={`fixed right-5 top-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
            saveNotice.type === "success" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-red-50 text-red-800 ring-red-200"
          }`}
        >
          {saveNotice.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {saveNotice.message}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <LanguageSelector value={draft.language ?? "Python"} onChange={(language) => setDraft((current) => ({ ...current, language }))} />
        <Select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as Category }))}>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Switch checked={Boolean(draft.is_favorite)} onCheckedChange={(checked) => setDraft((current) => ({ ...current, is_favorite: checked }))} label="Favorite" />
      </div>
      <Input
        ref={titleInputRef}
        value={draft.title ?? ""}
        placeholder="Snippet title"
        className={saveNotice?.type === "error" && !(draft.title ?? "").trim() ? "border-red-300 focus:ring-red-500" : undefined}
        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
      />
      {taskOptions.length ? (
        <TaskSearchPicker value={draft.task_id} tasks={taskOptions} onChange={(taskId) => setDraft((current) => ({ ...current, task_id: taskId }))} />
      ) : null}
      <Textarea value={draft.description ?? ""} placeholder="Description" onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
      <CodeMirror height={fullHeight ? "calc(100vh - 390px)" : undefined} value={draft.code ?? ""} extensions={[extension]} onChange={(value) => setDraft((current) => ({ ...current, code: value }))} />
      <Input value={(draft.tags ?? []).join(", ")} placeholder="tags" onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void saveManually()} disabled={saving}><Save className="h-4 w-4" />{saving ? "Saving..." : "Save"}</Button>
        <Button variant="secondary" onClick={() => navigator.clipboard.writeText(draft.code ?? "")}><Copy className="h-4 w-4" />Copy</Button>
        {onDelete ? (
          <Button variant="danger" onClick={onDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        ) : null}
        {draft.is_favorite ? <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> : null}
      </div>
    </div>
  );
}
