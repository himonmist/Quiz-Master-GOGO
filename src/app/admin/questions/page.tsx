import Link from "next/link";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DeleteQuestionButton } from "@/components/admin/DeleteQuestionButton";

export default async function AdminQuestionsPage() {
  const user = await requireUser(STAFF_ROLES);
  const questions = user.organizationId
    ? await prisma.question.findMany({
        where: { organizationId: user.organizationId, deletedAt: null },
        include: { category: { select: { name: true } }, course: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      })
    : [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>Question Bank</h2>
          <p className="text-muted">{questions.length} active questions.</p>
        </div>
        <Link href="/admin/questions/new" className="btn btn-primary">
          + New Question
        </Link>
      </div>

      <div className="card elev-sm" style={{ padding: "8px 16px" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Type</th>
              <th>Difficulty</th>
              <th>Course</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td style={{ maxWidth: 420 }}>{q.text}</td>
                <td className="text-muted">{q.type.replace("_", " ")}</td>
                <td>
                  <span className="tag tag-accent-2">{q.difficulty}</span>
                </td>
                <td className="text-muted">{q.course?.title ?? "—"}</td>
                <td style={{ display: "flex", gap: 4 }}>
                  <Link href={`/admin/questions/${q.id}/edit`} className="btn btn-ghost btn-sm">
                    Edit
                  </Link>
                  <DeleteQuestionButton questionId={q.id} />
                </td>
              </tr>
            ))}
            {questions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No questions yet — add your first one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
