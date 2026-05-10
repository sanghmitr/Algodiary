import { Outlet, useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useWebSocket } from "../../hooks/useWebSocket";

export function Layout() {
  const navigate = useNavigate();
  useWebSocket();
  useHotkeys("meta+k, ctrl+k", (event) => {
    event.preventDefault();
    navigate("/kb");
    window.setTimeout(() => document.getElementById("kb-search")?.focus(), 0);
  });
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
