import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/helpers";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-brand-500 transition focus:ring-2", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn("min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500 transition focus:ring-2", className)} {...props} />
));
Textarea.displayName = "Textarea";

