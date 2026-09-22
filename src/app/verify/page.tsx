"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyLandingPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (code.trim()) router.push(`/verify/${encodeURIComponent(code.trim())}`);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card elev-md" style={{ width: "min(460px, 100%)", padding: "40px 36px", gap: 14 }}>
        <Link href="/" style={{ fontFamily: "var(--font-heading)", fontSize: 15, letterSpacing: "0.06em", color: "var(--color-accent-700)", textDecoration: "none" }}>
          QUIZ MASTER GOGO
        </Link>
        <h2 style={{ marginBottom: 2 }}>Verify a certificate</h2>
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 8 }}>Enter a certificate ID to confirm it&apos;s genuine.</p>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
          <input className="input" placeholder="CERT-2026-000123" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-primary">Verify</button>
        </form>
      </div>
    </div>
  );
}
