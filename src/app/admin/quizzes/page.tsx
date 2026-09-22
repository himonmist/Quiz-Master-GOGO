import Link from "next/link";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { QuizStatusActions } from "@/components/admin/QuizStatusActions";

export default async function AdminQuizzesPage() {
  const user = await requireUser(STAFF_ROLES);
  const quizzes = user.organizationId
    ? await prisma.quiz.findMany({
        where: { organizationId: user.organizationId, deletedAt: null },
        include: { course: { select: { title: true } }, _count: { select: { quizQuestions: true, attempts: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ marginBottom: 2 }}>Quiz Management</h2>
          <p className="text-muted">Build, schedule and monitor quizzes.</p>
        </div>
        <Link href="/admin/quizzes/new" className="btn btn-primary">
          + New Quiz
        </Link>
      </div>

      <div className="card elev-sm" style={{ padding: "8px 16px" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Quiz</th>
              <th>Course</th>
              <th>Status</th>
              <th>Questions</th>
              <th>Attempts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q.id}>
                <td>{q.title}</td>
                <td>{q.course.title}</td>
                <td>
                  <span className="tag tag-accent-2">{q.status}</span>
                </td>
                <td>{q._count.quizQuestions}</td>
                <td>{q._count.attempts}</td>
                <td>
                  <QuizStatusActions quizId={q.id} status={q.status} />
                </td>
              </tr>
            ))}
            {quizzes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No quizzes yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
