"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/app/admin/actions";

export function NewCourseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<{ error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const result = await createCourse(new FormData(form));
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
        + New Course
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card elev-sm" style={{ padding: 20, gap: 10 }}>
      <div className="card-title">New Course</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="instructor">Instructor</label>
          <input id="instructor" name="instructor" className="input" />
        </div>
        <div className="field">
          <label htmlFor="startDate">Start date</label>
          <input id="startDate" name="startDate" type="date" className="input" />
        </div>
        <div className="field">
          <label htmlFor="endDate">End date</label>
          <input id="endDate" name="endDate" type="date" className="input" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" className="input" rows={3} />
      </div>
      {status?.error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{status.error}</p> : null}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creating…" : "Create course"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
