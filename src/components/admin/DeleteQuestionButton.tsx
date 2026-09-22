"use client";

import { useRouter } from "next/navigation";
import { deleteQuestion } from "@/app/admin/actions";

export function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--color-danger)" }}
      onClick={async () => {
        if (!confirm("Remove this question from the bank? Existing quizzes that already used it keep their history.")) return;
        await deleteQuestion(questionId);
        router.refresh();
      }}
    >
      Delete
    </button>
  );
}
