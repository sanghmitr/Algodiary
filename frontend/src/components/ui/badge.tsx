import type { HTMLAttributes } from "react";
import { cn } from "../../utils/helpers";

type BadgeTone = "slate" | "blue" | "purple" | "orange" | "teal" | "green" | "gold" | "red";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  const tones: Record<BadgeTone, string> = {
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    teal: "bg-teal-100 text-teal-700",
    green: "bg-emerald-100 text-emerald-700",
    gold: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", tones[tone], className)} {...props} />;
}

