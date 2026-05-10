import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AuthShell } from "../components/brand/AuthShell";

export function Login() {
  const { login, accessToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return (
    <AuthShell
      eyebrow="Welcome back"
      title={<>Pick up your <span className="italic text-[#1a6b4a]">prep diary</span></>}
      subtitle="Sign in to continue your tasks, notes, snippets, and interview revision flow."
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Secure sign in</p>
          <h2 className="font-serif-brand mt-3 text-4xl">Algo<span className="italic text-[#1a6b4a]">Diary</span></h2>
        </div>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); login.mutate({ email, password }); }}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-black/65">Email</span>
            <Input className="h-12 border-black/10 bg-[#f8f7f4] focus:ring-[#1a6b4a]" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-black/65">Password</span>
            <Input className="h-12 border-black/10 bg-[#f8f7f4] focus:ring-[#1a6b4a]" type="password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {login.isError ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Could not sign in with those credentials.</p> : null}
          <Button className="h-12 w-full bg-[#0e0e0e] hover:bg-black" disabled={login.isPending}>{login.isPending ? "Signing in..." : "Sign in"}</Button>
        </form>
        <p className="mt-5 text-sm text-black/55">
          New here? <Link className="font-semibold text-[#1a6b4a] hover:text-[#0e0e0e]" to="/register">Create an account</Link>
        </p>
      </div>
    </AuthShell>
  );
}
