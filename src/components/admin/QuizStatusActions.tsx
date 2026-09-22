"use client";

import { useRouter } from "next/navigation";
import { setQuizStatus } from "@/app/admin/actions";

const NEXT_STATUS: Record<string, { label: string; next: "DRAFT" | "SCHEDULED" | "LIVE" | "COMPLETED" | "ARCHIVED" }[]> = {
  DRAFT: [{ label: "Go Live", next: "LIVE" }, { label: "Schedule", next: "SCHEDULED" }],
  SCHEDULED: [{ label: "Go Live", next: "LIVE" }, { label: "Back to Draft", next: "DRAFT" }],
  LIVE: [{ label: "End Quiz", next: "COMPLETED" }],
  COMPLETED: [{ label: "Archive", next: "ARCHIVED" }],
  ARCHIVED: [],
};

export function QuizStatusActions({ quizId, status }: { quizId: string; status: string }) {
  const router = useRouter();
  const actions = NEXT_STATUS[status] ?? [];

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {actions.map((a) => (
        <button
          key={a.next}
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            await setQuizStatus(quizId, a.next);
            router.refresh();
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
