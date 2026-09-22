"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

interface Org {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    organizationId: "",
    designation: "",
    country: "",
    acceptTerms: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((data) => {
        setOrgs(data.organizations ?? []);
        if (data.organizations?.length === 1) {
          setForm((f) => ({ ...f, organizationId: data.organizations[0].id }));
        }
      })
      .catch(() => setOrgs([]));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join the next live competition"
      footer={
        <p className="text-muted" style={{ textAlign: "center", fontSize: 13, marginTop: 16, marginBottom: 0 }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit}>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" className="input" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="email">Email address</label>
          <input id="email" className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required autoComplete="email" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" className="input" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input id="confirmPassword" className="input" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required autoComplete="new-password" />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="organizationId">Organization</label>
          <select id="organizationId" className="input" value={form.organizationId} onChange={(e) => update("organizationId", e.target.value)} required>
            <option value="">Select your organization…</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div className="field">
            <label htmlFor="mobileNumber">Mobile number</label>
            <input id="mobileNumber" className="input" value={form.mobileNumber} onChange={(e) => update("mobileNumber", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="designation">Designation</label>
            <input id="designation" className="input" value={form.designation} onChange={(e) => update("designation", e.target.value)} />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="country">Country</label>
          <input id="country" className="input" value={form.country} onChange={(e) => update("country", e.target.value)} />
        </div>
        <label className="checkbox" style={{ marginBottom: 18, fontSize: 13 }}>
          <input type="checkbox" checked={form.acceptTerms} onChange={(e) => update("acceptTerms", e.target.checked)} required />
          <span className="box" aria-hidden>
            {form.acceptTerms ? "✓" : ""}
          </span>
          I accept the Terms &amp; Conditions
        </label>
        {error ? (
          <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 14 }}>
            {error}
          </p>
        ) : null}
        <button className="btn btn-primary btn-block" style={{ fontSize: 15, padding: 12 }} disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </AuthCard>
  );
}
