import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { useAuthStore } from "./store/authStore";
import { Dashboard } from "./pages/Dashboard";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Notes } from "./pages/Notes";
import { Progress } from "./pages/Progress";
import { Register } from "./pages/Register";
import { Settings } from "./pages/Settings";
import { Snippets } from "./pages/Snippets";
import { Tasks } from "./pages/Tasks";

function RequireAuth() {
  const token = useAuthStore((state) => state.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <Layout />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/snippets" element={<Snippets />} />
        <Route path="/kb" element={<KnowledgeBase />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
