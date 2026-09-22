"use client";

import { useRouter } from "next/navigation";
import { setCourseStatus } from "@/app/admin/actions";

const NEXT_STATUS: Record<string, { label: string; next: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED" }[]> = {
  DRAFT: [{ label: "Publish", next: "ACTIVE" }],
  ACTIVE: [
    { label: "Complete", next: "COMPLETED" },
    { label: "Archive", next: "ARCHIVED" },
  ],
  COMPLETED: [{ label: "Archive", next: "ARCHIVED" }],
  ARCHIVED: [{ label: "Reactivate", next: "ACTIVE" }],
};

export function CourseStatusActions({ courseId, status }: { courseId: string; status: string }) {
  const router = useRouter();
  const actions = NEXT_STATUS[status] ?? [];

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {actions.map((a) => (
        <button
          key={a.next}
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await setCourseStatus(courseId, a.next);
            router.refresh();
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
