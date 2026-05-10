import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { NotificationBell } from "../notifications/NotificationBell";

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <button className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500" onClick={() => navigate("/kb")}>
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search knowledge base</span>
        <kbd className="rounded bg-slate-100 px-1.5 text-xs">⌘K</kbd>
      </button>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <span className="hidden text-sm font-medium text-slate-700 sm:inline">{user?.full_name}</span>
        <Button variant="secondary" size="sm" onClick={() => logout.mutate()}>
          Logout
        </Button>
      </div>
    </header>
  );
}

