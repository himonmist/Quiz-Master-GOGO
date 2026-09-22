"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      const next = params.get("next");
      const role = data.user?.role;
      const destination = next ?? (role && role !== "PARTICIPANT" ? "/admin" : "/dashboard");
      router.push(destination);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your quiz journey"
      footer={
        <p className="text-muted" style={{ textAlign: "center", fontSize: 13, marginTop: 16, marginBottom: 0 }}>
          Don&apos;t have an account? <Link href="/register">Create account</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <div className="field" style={{ marginBottom: 14 }}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <label className="checkbox" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            <span className="box" aria-hidden>
              {rememberMe ? "✓" : ""}
            </span>
            Remember me
          </label>
          <Link href="/forgot-password" className="btn btn-ghost" style={{ padding: 0, fontSize: 13 }}>
            Forgot password?
          </Link>
        </div>
        {error ? (
          <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 14 }}>
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary btn-block" style={{ fontSize: 15, padding: 12 }} disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
