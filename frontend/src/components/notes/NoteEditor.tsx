import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { Save, Star } from "lucide-react";
import type { Category, Note } from "../../types";
import { CATEGORIES } from "../../utils/constants";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Switch } from "../ui/switch";

interface Props {
  note: Note | null;
  onSave: (payload: Partial<Note>) => void;
}

export function NoteEditor({ note, onSave }: Props) {
  const [draft, setDraft] = useState<Partial<Note>>({ title: "", content: "", category: "DSA", tags: [], is_revision_ready: false });

  useEffect(() => {
    if (note) setDraft(note);
  }, [note]);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => onSave(draft), 1000);
    return () => window.clearTimeout(timer);
  }, [draft, note, onSave]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as Category }))}>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Switch checked={Boolean(draft.is_revision_ready)} onCheckedChange={(checked) => setDraft((current) => ({ ...current, is_revision_ready: checked }))} label="Revision Ready" />
        {draft.is_revision_ready ? <Badge tone="gold"><Star className="mr-1 h-3 w-3 fill-amber-400" />Ready</Badge> : null}
      </div>
      <Input value={draft.title ?? ""} placeholder="Note title" onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
      <CodeMirror value={draft.content ?? ""} extensions={[markdown()]} onChange={(value) => setDraft((current) => ({ ...current, content: value }))} />
      <Input
        value={(draft.tags ?? []).join(", ")}
        placeholder="tags: arrays, graph, dp"
        onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) }))}
      />
      <Button onClick={() => onSave(draft)}>
        <Save className="h-4 w-4" />
        Save
      </Button>
    </div>
  );
}

