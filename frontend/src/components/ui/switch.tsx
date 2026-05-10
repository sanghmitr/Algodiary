import { cn } from "../../utils/helpers";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export function Switch({ checked, onCheckedChange, label }: SwitchProps) {
  return (
    <button type="button" className="inline-flex items-center gap-2 text-sm text-slate-700" onClick={() => onCheckedChange(!checked)}>
      <span className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-brand-600" : "bg-slate-300")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}

