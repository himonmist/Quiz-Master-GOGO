"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setSent(true);
      setDevLink(data.resetLink ?? null);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We'll email you a link to reset it"
      footer={
        <p className="text-muted" style={{ textAlign: "center", fontSize: 13, marginTop: 16, marginBottom: 0 }}>
          <Link href="/login">Back to sign in</Link>
        </p>
      }
    >
      {sent ? (
        <div>
          <p style={{ fontSize: 14 }}>If an account exists for that email, a reset link is on its way.</p>
          {devLink ? (
            <p className="text-muted" style={{ fontSize: 12 }}>
              Dev mode (no email provider configured) — <Link href={devLink}>open the reset link</Link>
            </p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="field" style={{ marginBottom: 18 }}>
            <label htmlFor="email">Email address</label>
            <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error ? (
            <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 14 }}>
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary btn-block" style={{ fontSize: 15, padding: 12 }} disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
