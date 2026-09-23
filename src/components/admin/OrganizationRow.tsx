"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization, setOrganizationActive, deleteOrganization } from "@/app/admin/organizations/actions";

interface OrganizationRowProps {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  counts: { users: number; courses: number; quizzes: number; questions: number };
  canDelete: boolean;
}

export function OrganizationRow({ id, name, description, isActive, counts, canDelete }: OrganizationRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await updateOrganization(id, new FormData(e.currentTarget));
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function onToggleActive() {
    setLoading(true);
    await setOrganizationActive(id, !isActive);
    setLoading(false);
    router.refresh();
  }

  async function onDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setLoading(true);
    const result = await deleteOrganization(id);
    setLoading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={5}>
          <form onSubmit={onSave} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0" }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor={`name-${id}`}>Name</label>
              <input id={`name-${id}`} name="name" className="input" defaultValue={name} required minLength={2} maxLength={160} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor={`description-${id}`}>Description</label>
              <input id={`description-${id}`} name="description" className="input" defaultValue={description ?? ""} maxLength={500} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 22 }}>
              <button className="btn btn-primary btn-sm" disabled={loading}>
                Save
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
          {error ? <p style={{ color: "var(--color-danger)", fontSize: 13 }}>{error}</p> : null}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>
        <div>{name}</div>
        {description ? <div className="text-muted" style={{ fontSize: 12 }}>{description}</div> : null}
      </td>
      <td>
        <span className={`tag ${isActive ? "tag-accent-2" : ""}`}>{isActive ? "Active" : "Inactive"}</span>
      </td>
      <td className="text-muted">{counts.users}</td>
      <td className="text-muted">
        {counts.courses} courses · {counts.quizzes} quizzes · {counts.questions} questions
      </td>
      <td style={{ display: "flex", gap: 4 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} disabled={loading}>
          Edit
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onToggleActive} disabled={loading}>
          {isActive ? "Deactivate" : "Activate"}
        </button>
        {canDelete ? (
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--color-danger)" }} onClick={onDelete} disabled={loading}>
            Delete
          </button>
        ) : null}
      </td>
    </tr>
  );
}
