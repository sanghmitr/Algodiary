import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

interface Props {
  value: string[];
  suggestions: string[];
  onChange: (tags: string[]) => void;
}

function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, "-");
}

function addTags(current: string[], rawTags: string[]): string[] {
  const seen = new Set(current.map((tag) => tag.toLowerCase()));
  const next = [...current];
  rawTags.map(normalizeTag).filter(Boolean).forEach((tag) => {
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      next.push(tag);
    }
  });
  return next;
}

export function TagPicker({ value, suggestions, onChange }: Props) {
  const [input, setInput] = useState("");
  const selectedKeys = useMemo(() => new Set(value.map((tag) => tag.toLowerCase())), [value]);
  const filteredSuggestions = useMemo(() => {
    const query = input.trim().toLowerCase();
    return suggestions
      .filter((tag) => !selectedKeys.has(tag.toLowerCase()))
      .filter((tag) => !query || tag.toLowerCase().includes(query))
      .slice(0, 8);
  }, [input, selectedKeys, suggestions]);
  const normalizedInput = normalizeTag(input);
  const canCreate = normalizedInput && !selectedKeys.has(normalizedInput.toLowerCase()) && !suggestions.some((tag) => tag.toLowerCase() === normalizedInput.toLowerCase());

  const commit = (raw = input) => {
    const parts = raw.split(",").map((tag) => tag.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange(addTags(value, parts));
    setInput("");
  };

  const remove = (tag: string) => onChange(value.filter((item) => item !== tag));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-white p-2 focus-within:ring-2 focus-within:ring-brand-500">
        {value.map((tag) => (
          <button key={tag} type="button" onClick={() => remove(tag)} aria-label={`Remove ${tag}`}>
            <Badge tone="green">
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          </button>
        ))}
        <Input
          className="h-7 min-w-[12rem] flex-1 border-0 px-1 focus:ring-0"
          value={input}
          placeholder={value.length ? "Add label" : "Add labels"}
          onBlur={() => commit()}
          onChange={(event) => {
            const next = event.target.value;
            if (next.includes(",")) {
              commit(next);
              return;
            }
            setInput(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Backspace" && !input && value.length) {
              remove(value[value.length - 1]);
            }
          }}
        />
      </div>
      {input.trim() || filteredSuggestions.length ? (
        <div className="flex flex-wrap gap-2">
          {filteredSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-brand-100"
              onMouseDown={(event) => {
                event.preventDefault();
                commit(tag);
              }}
            >
              {tag}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
              onMouseDown={(event) => {
                event.preventDefault();
                commit(normalizedInput);
              }}
            >
              <Plus className="h-3 w-3" />
              Create {normalizedInput}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
