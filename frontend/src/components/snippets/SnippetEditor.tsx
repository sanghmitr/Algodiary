import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { Copy, Save, Star } from "lucide-react";
import type { Category, Snippet } from "../../types";
import { CATEGORIES } from "../../utils/constants";
import { Button } from "../ui/button";
import { Input, Textarea } from "../ui/input";
import { Select } from "../ui/select";
import { Switch } from "../ui/switch";
import { LanguageSelector } from "./LanguageSelector";

interface Props {
  snippet: Snippet | null;
  onSave: (payload: Partial<Snippet>) => void;
}

export function SnippetEditor({ snippet, onSave }: Props) {
  const [draft, setDraft] = useState<Partial<Snippet>>({ title: "", code: "", language: "Python", category: "DSA", description: "", tags: [], is_favorite: false });
  useEffect(() => {
    if (snippet) setDraft(snippet);
  }, [snippet]);
  const extension = useMemo(() => {
    if (draft.language === "Java") return java();
    if (draft.language === "JavaScript" || draft.language === "TypeScript") return javascript({ typescript: draft.language === "TypeScript" });
    if (draft.language === "SQL") return sql();
    return python();
  }, [draft.language]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <LanguageSelector value={draft.language ?? "Python"} onChange={(language) => setDraft((current) => ({ ...current, language }))} />
        <Select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as Category }))}>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Switch checked={Boolean(draft.is_favorite)} onCheckedChange={(checked) => setDraft((current) => ({ ...current, is_favorite: checked }))} label="Favorite" />
      </div>
      <Input value={draft.title ?? ""} placeholder="Snippet title" onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
      <Textarea value={draft.description ?? ""} placeholder="Description" onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
      <CodeMirror value={draft.code ?? ""} extensions={[extension]} onChange={(value) => setDraft((current) => ({ ...current, code: value }))} />
      <Input value={(draft.tags ?? []).join(", ")} placeholder="tags" onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))} />
      <div className="flex gap-2">
        <Button onClick={() => onSave(draft)}><Save className="h-4 w-4" />Save</Button>
        <Button variant="secondary" onClick={() => navigator.clipboard.writeText(draft.code ?? "")}><Copy className="h-4 w-4" />Copy</Button>
        {draft.is_favorite ? <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> : null}
      </div>
    </div>
  );
}

