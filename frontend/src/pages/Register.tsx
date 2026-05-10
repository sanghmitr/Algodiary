import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { AuthShell } from "../components/brand/AuthShell";

export function Register() {
  const { register, accessToken } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return (
    <AuthShell
      eyebrow="Start your preparation journey"
      title={<>Build your <span className="italic text-[#1a6b4a]">interview memory</span></>}
      subtitle="Create your workspace and get the prep plan, notes, snippets, and Knowledge Base ready from day one."
    >
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/35">Create account</p>
          <h2 className="font-serif-brand mt-3 text-4xl">Algo<span className="italic text-[#1a6b4a]">Diary</span></h2>
        </div>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); register.mutate({ email, full_name: fullName, password }); }}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-black/65">Full name</span>
            <Input className="h-12 border-black/10 bg-[#f8f7f4] focus:ring-[#1a6b4a]" placeholder="Your name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-black/65">Email</span>
            <Input className="h-12 border-black/10 bg-[#f8f7f4] focus:ring-[#1a6b4a]" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-black/65">Password</span>
            <Input className="h-12 border-black/10 bg-[#f8f7f4] focus:ring-[#1a6b4a]" type="password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </label>
          {register.isError ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Could not create account.</p> : null}
          <Button className="h-12 w-full bg-[#0e0e0e] hover:bg-black" disabled={register.isPending}>{register.isPending ? "Creating..." : "Create account"}</Button>
        </form>
        <p className="mt-5 text-sm text-black/55">
          Already have an account? <Link className="font-semibold text-[#1a6b4a] hover:text-[#0e0e0e]" to="/login">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
