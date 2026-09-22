"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p style={{ fontSize: 14 }}>This reset link is missing its token. Please request a new one.</p>;
  }

  if (done) {
    return <p style={{ fontSize: 14 }}>Password updated. Redirecting to sign in…</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field" style={{ marginBottom: 12 }}>
        <label htmlFor="password">New password</label>
        <input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className="field" style={{ marginBottom: 18 }}>
        <label htmlFor="confirmPassword">Confirm new password</label>
        <input id="confirmPassword" className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      </div>
      {error ? (
        <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 14 }}>
          {error}
        </p>
      ) : null}
      <button className="btn btn-primary btn-block" style={{ fontSize: 15, padding: 12 }} disabled={loading}>
        {loading ? "Saving…" : "Reset password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Reset password" subtitle="Choose a new password for your account">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
