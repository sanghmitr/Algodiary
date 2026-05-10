import type { SelectHTMLAttributes } from "react";
import { cn } from "../../utils/helpers";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-brand-500 focus:ring-2", className)} {...props} />;
}

