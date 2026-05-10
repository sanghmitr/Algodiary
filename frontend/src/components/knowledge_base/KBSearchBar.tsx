import { Search } from "lucide-react";
import { Input } from "../ui/input";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function KBSearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
      <Input id="kb-search" autoFocus className="h-12 pl-12 text-base" placeholder="Search notes, snippets, code..." value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

