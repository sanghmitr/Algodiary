import { BarChart3, BookOpen, ChevronLeft, ChevronRight, ClipboardList, Code2, Home, NotebookTabs, Settings } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "../ui/button";
import { cn } from "../../utils/helpers";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/notes", label: "Notes", icon: NotebookTabs },
  { to: "/snippets", label: "Snippets", icon: Code2 },
  { to: "/kb", label: "Knowledge Base", icon: BookOpen },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("algodiary_sidebar") === "collapsed");
  const toggle = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("algodiary_sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  };
  return (
    <aside className={cn("hidden h-screen shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4 transition-[width] duration-200 md:block", collapsed ? "w-20" : "w-64")}>
      <div className={cn("mb-6 flex items-start gap-2", collapsed ? "justify-center px-0" : "justify-between px-3")}>
        {!collapsed ? (
          <div>
            <p className="text-xl font-bold text-slate-950">Algodiary</p>
            <p className="text-xs text-slate-500">FAANG prep tracker</p>
          </div>
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-sm font-bold text-white" title="Algodiary">
            A
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            title={collapsed ? label : undefined}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-md py-2 text-sm font-medium transition",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {!collapsed ? <span>{label}</span> : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
