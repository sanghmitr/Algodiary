import { cn } from "../../utils/helpers";

interface LogoMarkProps {
  className?: string;
  iconClassName?: string;
  darkIcon?: boolean;
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  compact?: boolean;
}

export function LogoMark({ className, iconClassName, darkIcon = false }: LogoMarkProps) {
  const fill = darkIcon ? "#0e0e0e" : "white";

  return (
    <div className={cn("grid h-9 w-9 place-items-center rounded-lg bg-[#0e0e0e]", className)}>
      <svg className={cn("h-5 w-5", iconClassName)} viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="6" height="6" rx="1.5" fill={fill} opacity=".9" />
        <rect x="10" y="2" width="6" height="2.5" rx="1" fill={fill} opacity=".6" />
        <rect x="10" y="6" width="4" height="2.5" rx="1" fill={fill} opacity=".4" />
        <rect x="2" y="10" width="14" height="2" rx="1" fill={fill} opacity=".7" />
        <rect x="2" y="14" width="9" height="2" rx="1" fill={fill} opacity=".4" />
      </svg>
    </div>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif-brand text-2xl leading-none tracking-normal text-[#0e0e0e]", className)}>
      Algo<span className="italic text-[#1a6b4a]">Diary</span>
    </span>
  );
}

export function Logo({ className, markClassName, wordmarkClassName, compact = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="AlgoDiary">
      <LogoMark className={markClassName} />
      {!compact ? <LogoWordmark className={wordmarkClassName} /> : null}
    </div>
  );
}
