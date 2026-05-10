import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";

export function Login() {
  const { login, accessToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold">Algodiary</h1>
          <p className="text-sm text-slate-500">Sign in to continue your interview prep.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); login.mutate({ email, password }); }}>
            <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {login.isError ? <p className="text-sm text-red-600">Could not sign in with those credentials.</p> : null}
            <Button className="w-full" disabled={login.isPending}>{login.isPending ? "Signing in..." : "Sign in"}</Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">New here? <Link className="font-medium text-brand-600" to="/register">Create an account</Link></p>
        </CardContent>
      </Card>
    </main>
  );
}

