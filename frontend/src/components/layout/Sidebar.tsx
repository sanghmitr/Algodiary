import { BarChart3, BookOpen, ClipboardList, Code2, Home, NotebookTabs, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
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
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-3 py-4 md:block">
      <div className="mb-6 px-3">
        <p className="text-xl font-bold text-slate-950">Algodiary</p>
        <p className="text-xs text-slate-500">FAANG prep tracker</p>
      </div>
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition", isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

