"use client";

import { useState, type FormEvent } from "react";
import { updateProfile, changePassword } from "@/app/(participant)/actions";

export function EditProfileForm({
  fullName,
  mobileNumber,
  designation,
  country,
}: {
  fullName: string;
  mobileNumber: string;
  designation: string;
  country: string;
}) {
  const [status, setStatus] = useState<{ error?: string; ok?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(new FormData(e.currentTarget));
    setStatus(result);
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="card elev-sm" style={{ padding: 22, gap: 12 }}>
      <div className="card-title">Profile details</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" name="fullName" className="input" defaultValue={fullName} required />
        </div>
        <div className="field">
          <label htmlFor="mobileNumber">Mobile number</label>
          <input id="mobileNumber" name="mobileNumber" className="input" defaultValue={mobileNumber} />
        </div>
        <div className="field">
          <label htmlFor="designation">Designation</label>
          <input id="designation" name="designation" className="input" defaultValue={designation} />
        </div>
        <div className="field">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" className="input" defaultValue={country} />
        </div>
      </div>
      {status?.error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{status.error}</p> : null}
      {status?.ok ? <p style={{ color: "var(--color-accent-2-700)", fontSize: 13 }}>Saved.</p> : null}
      <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [status, setStatus] = useState<{ error?: string; ok?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const result = await changePassword(new FormData(form));
    setStatus(result);
    setLoading(false);
    if (result.ok) form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="card elev-sm" style={{ padding: 22, gap: 12 }}>
      <div className="card-title">Change password</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="field">
          <label htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" name="newPassword" type="password" className="input" required minLength={8} />
        </div>
      </div>
      {status?.error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{status.error}</p> : null}
      {status?.ok ? <p style={{ color: "var(--color-accent-2-700)", fontSize: 13 }}>Password updated.</p> : null}
      <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }} disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
