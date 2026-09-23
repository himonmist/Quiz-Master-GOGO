"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createOrganization } from "@/app/admin/organizations/actions";

export function NewOrganizationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{ error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const result = await createOrganization(new FormData(form));
    setLoading(false);
    if (result.error) {
      setStatus(result);
      return;
    }
    form.reset();
    setOpen(false);
    setStatus(null);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + New Organization
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card elev-sm" style={{ padding: 20, gap: 10 }}>
      <div className="card-title">New Organization</div>
      <div className="field">
        <label htmlFor="org-name">Name</label>
        <input id="org-name" name="name" className="input" required minLength={2} maxLength={160} />
      </div>
      <div className="field">
        <label htmlFor="org-description">Description</label>
        <textarea id="org-description" name="description" className="input" rows={2} maxLength={500} />
      </div>
      {status?.error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{status.error}</p> : null}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Create organization"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
