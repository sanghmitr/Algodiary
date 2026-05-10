import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

interface AuthShellProps {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
}

const focusItems = ["DSA tasks", "System design notes", "Code snippets", "Revision search"];

export function AuthShell({ eyebrow, title, subtitle, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0e0e0e]">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-5 py-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="flex min-h-[calc(100vh-3rem)] flex-col justify-between">
          <Link to="/" aria-label="AlgoDiary home">
            <Logo />
          </Link>
          <div className="py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">{eyebrow}</p>
            <h1 className="font-serif-brand mt-5 max-w-xl text-5xl leading-[0.95] tracking-normal md:text-7xl">{title}</h1>
            <p className="mt-6 max-w-md text-lg font-light leading-8 text-black/60">{subtitle}</p>
          </div>
          <p className="hidden text-sm text-black/40 lg:block">AlgoDiary keeps your prep context close, searchable, and tied to the work you actually did.</p>
        </section>

        <section className="rounded-[28px] border border-black/10 bg-[#0e0e0e] p-3 shadow-[0_24px_80px_rgba(14,14,14,0.16)]">
          <div className="grid overflow-hidden rounded-[22px] bg-white lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="hidden border-r border-black/10 bg-[#fbfaf7] p-6 lg:block">
              <div className="rounded-lg border border-black/10 bg-[#f8f7f4] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Today</p>
                <div className="font-serif-brand mt-3 text-4xl">Day 24</div>
                <p className="mt-2 text-sm leading-6 text-black/55">Sliding window, database sharding, and LRU cache revision.</p>
              </div>
              <div className="mt-5 space-y-3">
                {focusItems.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3 text-sm font-medium text-black/65">
                    <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-orange-400" : index === 1 ? "bg-teal-500" : index === 2 ? "bg-emerald-500" : "bg-[#1a6b4a]"}`} />
                    {item}
                  </div>
                ))}
              </div>
            </aside>
            <div className="p-5 sm:p-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
