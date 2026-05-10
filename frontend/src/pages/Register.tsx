import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";

export function Register() {
  const { register, accessToken } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold">Create your Algodiary</h1>
          <p className="text-sm text-slate-500">Track the whole 90-day FAANG prep journey.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); register.mutate({ email, full_name: fullName, password }); }}>
            <Input placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
            {register.isError ? <p className="text-sm text-red-600">Could not create account.</p> : null}
            <Button className="w-full" disabled={register.isPending}>{register.isPending ? "Creating..." : "Create account"}</Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">Already have an account? <Link className="font-medium text-brand-600" to="/login">Sign in</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}

