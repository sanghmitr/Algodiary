import { Fragment, useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { keymap, type EditorView } from "@codemirror/view";
import type { Extension, TransactionSpec } from "@codemirror/state";
import { AlertCircle, Bold, CheckCircle2, Code2, Eye, Heading2, ImagePlus, Italic, LinkIcon, List, Pencil, Save, Star, X } from "lucide-react";
import { deleteNoteImage, uploadNoteImage } from "../../api/notes";
import type { Category, Note } from "../../types";
import { CATEGORIES } from "../../utils/constants";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Switch } from "../ui/switch";
import { TagPicker } from "./TagPicker";

interface Props {
  note: Note | null;
  onSave: (payload: Partial<Note>) => Promise<Note | void> | Note | void;
  availableTags?: string[];
  fullHeight?: boolean;
}

function noteChanged(note: Partial<Note>, draft: Partial<Note>): boolean {
  return (
    (draft.title ?? "") !== (note.title ?? "") ||
    (draft.content ?? "") !== (note.content ?? "") ||
    draft.category !== note.category ||
    Boolean(draft.is_pinned) !== Boolean(note.is_pinned) ||
    Boolean(draft.is_revision_ready) !== Boolean(note.is_revision_ready) ||
    JSON.stringify(draft.tags ?? []) !== JSON.stringify(note.tags ?? [])
  );
}

function savePayload(draft: Partial<Note>): Partial<Note> {
  return {
    title: draft.title,
    content: draft.content,
    category: draft.category,
    tags: draft.tags,
    is_pinned: draft.is_pinned,
    is_revision_ready: draft.is_revision_ready,
  };
}

function noteBaseline(note: Note): Partial<Note> {
  return savePayload(note);
}

function mergeSavedDraft(base: Partial<Note>, payload: Partial<Note>): Partial<Note> {
  return { ...base, ...payload };
}

function markdownImages(content: string): Array<{ alt: string; url: string }> {
  const images: Array<{ alt: string; url: string }> = [];
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    images.push({ alt: match[1] || "Diagram", url: match[2] });
  }
  return images;
}

function safeUrl(url: string): string {
  if (url.startsWith("/uploads/")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "#";
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${token}-${start}`}>{token.slice(2, -2)}</strong>);
    } else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        nodes.push(
          <a key={`${token}-${start}`} className="text-brand-700 underline underline-offset-2" href={safeUrl(link[2])} target="_blank" rel="noreferrer">
            {link[1]}
          </a>,
        );
      }
    }
    cursor = start + token.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

function codeLanguageExtensions(language?: string): Extension[] {
  const normalized = (language ?? "").trim().toLowerCase();
  if (["js", "jsx", "javascript"].includes(normalized)) return [javascript({ jsx: true, typescript: false })];
  if (["ts", "tsx", "typescript"].includes(normalized)) return [javascript({ jsx: true, typescript: true })];
  if (normalized === "python" || normalized === "py") return [python()];
  if (normalized === "java") return [java()];
  if (["sql", "postgres", "postgresql"].includes(normalized)) return [sql()];
  if (["c", "cc", "cpp", "c++", "h", "hpp"].includes(normalized)) return [cpp()];
  return [];
}

function CodePreview({ code, language }: { code: string; language?: string }) {
  const extensions = useMemo(() => codeLanguageExtensions(language), [language]);
  return (
    <div className="overflow-hidden rounded-lg bg-slate-950 text-sm">
      {language ? <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{language}</div> : null}
      <CodeMirror
        value={code}
        theme="dark"
        basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false }}
        extensions={extensions}
        editable={false}
        readOnly
      />
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const blocks = useMemo(() => {
    const lines = content.split(/\r?\n/);
    const parsed: Array<{ type: string; text?: string; level?: number; items?: string[]; language?: string; alt?: string; url?: string }> = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }
      if (line.startsWith("```")) {
        const language = line.slice(3).trim();
        const code: string[] = [];
        index += 1;
        while (index < lines.length && !lines[index].startsWith("```")) {
          code.push(lines[index]);
          index += 1;
        }
        parsed.push({ type: "code", text: code.join("\n"), language });
        index += 1;
        continue;
      }
      const image = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/.exec(line.trim());
      if (image) {
        parsed.push({ type: "image", alt: image[1] || "Diagram", url: image[2] });
        index += 1;
        continue;
      }
      const heading = /^(#{1,4})\s+(.+)$/.exec(line);
      if (heading) {
        parsed.push({ type: "heading", level: heading[1].length, text: heading[2] });
        index += 1;
        continue;
      }
      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^[-*]\s+/, ""));
          index += 1;
        }
        parsed.push({ type: "list", items });
        continue;
      }
      const paragraph: string[] = [];
      while (
        index < lines.length &&
        lines[index].trim() &&
        !lines[index].startsWith("```") &&
        !/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/.test(lines[index].trim()) &&
        !/^(#{1,4})\s+/.test(lines[index]) &&
        !/^[-*]\s+/.test(lines[index])
      ) {
        paragraph.push(lines[index]);
        index += 1;
      }
      parsed.push({ type: "paragraph", text: paragraph.join(" ") });
    }
    return parsed;
  }, [content]);

  if (!content.trim()) {
    return <div className="flex min-h-[16rem] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">Nothing to preview yet.</div>;
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const className = block.level === 1 ? "text-2xl font-bold text-slate-950" : block.level === 2 ? "text-xl font-semibold text-slate-950" : "text-base font-semibold text-slate-950";
          return <h2 key={index} className={className}>{renderInline(block.text ?? "")}</h2>;
        }
        if (block.type === "image") {
          return (
            <figure key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <a href={safeUrl(block.url ?? "")} target="_blank" rel="noreferrer">
                <img src={safeUrl(block.url ?? "")} alt={block.alt ?? "Diagram"} className="max-h-[34rem] w-full object-contain p-3" />
              </a>
              <figcaption className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">{block.alt}</figcaption>
            </figure>
          );
        }
        if (block.type === "code") {
          return <CodePreview key={index} code={block.text ?? ""} language={block.language} />;
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {(block.items ?? []).map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
            </ul>
          );
        }
        return <p key={index}>{renderInline(block.text ?? "").map((node, nodeIndex) => <Fragment key={nodeIndex}>{node}</Fragment>)}</p>;
      })}
    </div>
  );
}

export function NoteEditor({ note, onSave, availableTags = [], fullHeight = false }: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<Note>>({ title: "", content: "", category: "DSA", tags: [], is_revision_ready: false });
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [uploading, setUploading] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedNoteIdRef = useRef<string | null>(null);
  const savedDraftRef = useRef<Partial<Note> | null>(null);
  const editVersionRef = useRef(0);
  const images = markdownImages(draft.content ?? "");

  const updateDraft = (next: Partial<Note> | ((current: Partial<Note>) => Partial<Note>)) => {
    editVersionRef.current += 1;
    setDraft(next);
  };

  useEffect(() => {
    if (!note) {
      loadedNoteIdRef.current = null;
      savedDraftRef.current = null;
      setDraft({ title: "", content: "", category: "DSA", tags: [], is_revision_ready: false });
      return;
    }
    const incomingBaseline = noteBaseline(note);
    const currentBaseline = savedDraftRef.current;
    const isSameNote = loadedNoteIdRef.current === note.id;
    const hasUnsavedChanges = Boolean(currentBaseline && noteChanged(currentBaseline, draft));

    if (!isSameNote || !hasUnsavedChanges) {
      loadedNoteIdRef.current = note.id;
      savedDraftRef.current = incomingBaseline;
      setDraft(incomingBaseline);
    } else {
      savedDraftRef.current = incomingBaseline;
    }
  }, [note]);

  useEffect(() => {
    const savedDraft = savedDraftRef.current;
    if (!note || !savedDraft || !noteChanged(savedDraft, draft)) return;
    if (!(draft.title ?? "").trim()) return;
    const payload = savePayload(draft);
    const saveVersion = editVersionRef.current;
    const timer = window.setTimeout(() => {
      void Promise.resolve(onSave(payload))
        .then((updated) => {
          if (saveVersion !== editVersionRef.current) return;
          savedDraftRef.current = updated ? noteBaseline(updated) : mergeSavedDraft(savedDraft, payload);
        })
        .catch(() => {
          setSaveNotice({ type: "error", message: "Autosave failed. Try saving again." });
        });
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [draft, note, onSave]);

  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  const validateDraft = () => {
    if (!(draft.title ?? "").trim()) {
      setSaveNotice({ type: "error", message: "Add a note title before saving." });
      titleInputRef.current?.focus();
      return false;
    }
    if (!draft.category) {
      setSaveNotice({ type: "error", message: "Choose a category before saving." });
      return false;
    }
    return true;
  };

  const saveManually = async () => {
    if (!validateDraft()) return;
    setManualSaving(true);
    setSaveNotice(null);
    const payload = savePayload(draft);
    try {
      const updated = await onSave(payload);
      editVersionRef.current += 1;
      savedDraftRef.current = updated ? noteBaseline(updated) : mergeSavedDraft(savedDraftRef.current ?? {}, payload);
      setSaveNotice({ type: "success", message: "Note saved." });
    } catch (error) {
      setSaveNotice({ type: "error", message: error instanceof Error ? error.message : "Unable to save note." });
    } finally {
      setManualSaving(false);
    }
  };

  const insertMarkdown = (markdownText: string) => {
    const view = editorRef.current;
    if (!view || mode === "preview") {
      updateDraft((current) => ({ ...current, content: `${current.content ?? ""}\n${markdownText}` }));
      return;
    }
    const selection = view.state.selection.main;
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: markdownText },
      selection: { anchor: selection.from + markdownText.length },
      scrollIntoView: true,
    });
    view.focus();
  };

  const dispatchEditorChange = (spec: TransactionSpec) => {
    const view = editorRef.current;
    if (!view || mode === "preview") return false;
    view.dispatch({ ...spec, scrollIntoView: true });
    view.focus();
    return true;
  };

  const wrapSelection = (prefix: string, suffix = prefix, placeholder = "text") => {
    const view = editorRef.current;
    if (!view || mode === "preview") return false;
    const selection = view.state.selection.main;
    const selectedText = view.state.sliceDoc(selection.from, selection.to);
    const innerText = selectedText || placeholder;
    const insert = `${prefix}${innerText}${suffix}`;
    return dispatchEditorChange({
      changes: { from: selection.from, to: selection.to, insert },
      selection: { anchor: selection.from + prefix.length, head: selection.from + prefix.length + innerText.length },
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const view = editorRef.current;
    if (!view || mode === "preview") return false;
    const selection = view.state.selection.main;
    const doc = view.state.doc;
    const startLine = doc.lineAt(selection.from);
    const endPosition = selection.to > selection.from && doc.sliceString(selection.to - 1, selection.to) === "\n" ? selection.to - 1 : selection.to;
    const endLine = doc.lineAt(endPosition);
    const changes = [];
    let insertedBeforeHead = 0;
    for (let lineNumber = startLine.number; lineNumber <= endLine.number; lineNumber += 1) {
      const line = doc.line(lineNumber);
      if (!line.text.trim() || line.text.startsWith(prefix)) continue;
      changes.push({ from: line.from, insert: prefix });
      if (line.from <= selection.head) insertedBeforeHead += prefix.length;
    }
    if (!changes.length) return true;
    return dispatchEditorChange({
      changes,
      selection: { anchor: selection.anchor + (startLine.from <= selection.anchor ? prefix.length : 0), head: selection.head + insertedBeforeHead },
    });
  };

  const insertLink = () => {
    const view = editorRef.current;
    if (!view || mode === "preview") return false;
    const selection = view.state.selection.main;
    const selectedText = view.state.sliceDoc(selection.from, selection.to) || "link text";
    const insert = `[${selectedText}](https://)`;
    const urlStart = selection.from + selectedText.length + 3;
    return dispatchEditorChange({
      changes: { from: selection.from, to: selection.to, insert },
      selection: { anchor: urlStart, head: urlStart + "https://".length },
    });
  };

  const insertCodeBlock = () => {
    const view = editorRef.current;
    if (!view || mode === "preview") return false;
    const selection = view.state.selection.main;
    const selectedText = view.state.sliceDoc(selection.from, selection.to) || "code";
    const insert = `\n\`\`\`\n${selectedText}\n\`\`\`\n`;
    return dispatchEditorChange({
      changes: { from: selection.from, to: selection.to, insert },
      selection: { anchor: selection.from + 5, head: selection.from + 5 + selectedText.length },
    });
  };

  const insertImageMarkup = () => {
    const view = editorRef.current;
    if (!view || mode === "preview") return false;
    const selection = view.state.selection.main;
    const selectedText = view.state.sliceDoc(selection.from, selection.to) || "image";
    const insert = `![${selectedText}](https://)`;
    const urlStart = selection.from + selectedText.length + 4;
    return dispatchEditorChange({
      changes: { from: selection.from, to: selection.to, insert },
      selection: { anchor: urlStart, head: urlStart + "https://".length },
    });
  };

  const markdownShortcuts = useMemo(
    () =>
      keymap.of([
        { key: "Mod-b", run: () => wrapSelection("**", "**", "bold text") },
        { key: "Mod-i", run: () => wrapSelection("_", "_", "italic text") },
        { key: "Mod-k", run: insertLink },
      ]),
    [mode],
  );

  const uploadImage = async (file: File) => {
    if (!note) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files can be uploaded.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const image = await uploadNoteImage(note.id, file);
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "diagram";
      insertMarkdown(`\n![${alt}](${image.url})\n`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadFirstImage = (files: FileList | null) => {
    const file = Array.from(files ?? []).find((item) => item.type.startsWith("image/"));
    if (file) void uploadImage(file);
  };

  const removeImage = async (url: string) => {
    if (!note || deletingImageUrl) return;
    setDeletingImageUrl(url);
    setUploadError("");
    try {
      const updated = await deleteNoteImage(note.id, url);
      editVersionRef.current += 1;
      savedDraftRef.current = noteBaseline(updated);
      setDraft(updated);
      queryClient.setQueryData(["note", updated.id], updated);
      queryClient.setQueriesData<Note[]>({ queryKey: ["notes"] }, (current) => current?.map((item) => (item.id === updated.id ? updated : item)));
      void queryClient.invalidateQueries({ queryKey: ["kb"] });
      void queryClient.invalidateQueries({ queryKey: ["kb-stats"] });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to delete image.");
    } finally {
      setDeletingImageUrl("");
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const image = Array.from(event.clipboardData.files).find((file) => file.type.startsWith("image/"));
    if (!image) return;
    event.preventDefault();
    void uploadImage(image);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    const image = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/"));
    if (!image) return;
    event.preventDefault();
    void uploadImage(image);
  };

  return (
    <div className="space-y-4" onPasteCapture={handlePaste} onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
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
      <div className="flex flex-wrap items-center gap-2">
        <Select value={draft.category} onChange={(event) => updateDraft((current) => ({ ...current, category: event.target.value as Category }))}>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Switch checked={Boolean(draft.is_revision_ready)} onCheckedChange={(checked) => updateDraft((current) => ({ ...current, is_revision_ready: checked }))} label="Revision Ready" />
        {draft.is_revision_ready ? <Badge tone="gold"><Star className="mr-1 h-3 w-3 fill-amber-400" />Ready</Badge> : null}
      </div>
      <Input
        ref={titleInputRef}
        value={draft.title ?? ""}
        placeholder="Note title"
        className={saveNotice?.type === "error" && !(draft.title ?? "").trim() ? "border-red-300 focus:ring-red-500" : undefined}
        onChange={(event) => updateDraft((current) => ({ ...current, title: event.target.value }))}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading || !note}>
            <ImagePlus className="h-4 w-4" />
            {uploading ? "Uploading..." : "Add image"}
          </Button>
          <span className="text-xs text-slate-500">Paste or drop PNG, JPEG, GIF, WebP, or SVG diagrams into the editor.</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100" onClick={() => wrapSelection("**", "**", "bold text")} aria-label="Bold" title="Bold">
            <Bold className="h-4 w-4" />
          </button>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100" onClick={() => wrapSelection("_", "_", "italic text")} aria-label="Italic" title="Italic">
            <Italic className="h-4 w-4" />
          </button>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100" onClick={() => insertLinePrefix("## ")} aria-label="Heading" title="Heading">
            <Heading2 className="h-4 w-4" />
          </button>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100" onClick={() => insertLinePrefix("- ")} aria-label="Bulleted list" title="Bulleted list">
            <List className="h-4 w-4" />
          </button>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100" onClick={insertLink} aria-label="Link" title="Link">
            <LinkIcon className="h-4 w-4" />
          </button>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100" onClick={insertCodeBlock} aria-label="Code block" title="Code block">
            <Code2 className="h-4 w-4" />
          </button>
          <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100" onClick={insertImageMarkup} aria-label="Image markdown" title="Image markdown">
            <ImagePlus className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1">
          <button type="button" className={`inline-flex h-8 items-center justify-center gap-1 rounded px-3 text-sm font-semibold ${mode === "edit" ? "bg-white shadow-sm" : "text-slate-600"}`} onClick={() => setMode("edit")}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button type="button" className={`inline-flex h-8 items-center justify-center gap-1 rounded px-3 text-sm font-semibold ${mode === "preview" ? "bg-white shadow-sm" : "text-slate-600"}`} onClick={() => setMode("preview")}>
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden" onChange={(event) => uploadFirstImage(event.target.files)} />
      </div>
      {uploadError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p> : null}
      {mode === "edit" ? (
        <CodeMirror
          height={fullHeight ? "calc(100vh - 390px)" : undefined}
          value={draft.content ?? ""}
          onCreateEditor={(view) => {
            editorRef.current = view;
          }}
          onChange={(value) => updateDraft((current) => ({ ...current, content: value }))}
          extensions={[markdown(), markdownShortcuts]}
        />
      ) : (
        <MarkdownPreview content={draft.content ?? ""} />
      )}
      {mode === "edit" && images.length ? (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Images in this note</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <div key={`${image.url}-${image.alt}`} className="group relative overflow-hidden rounded-md border border-slate-200 bg-white">
                <button
                  type="button"
                  className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void removeImage(image.url)}
                  disabled={Boolean(deletingImageUrl)}
                  aria-label={`Delete ${image.alt}`}
                  title="Delete image"
                >
                  <X className="h-4 w-4" />
                </button>
                <a href={image.url} target="_blank" rel="noreferrer" className="block">
                  <img src={image.url} alt={image.alt} className="h-40 w-full object-contain p-2" />
                  <p className="truncate border-t border-slate-100 px-2 py-1 text-xs text-slate-500">
                    {deletingImageUrl === image.url ? "Deleting..." : image.alt}
                  </p>
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <TagPicker value={draft.tags ?? []} suggestions={availableTags} onChange={(tags) => updateDraft((current) => ({ ...current, tags }))} />
      <Button onClick={() => void saveManually()} disabled={manualSaving}>
        <Save className="h-4 w-4" />
        {manualSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
