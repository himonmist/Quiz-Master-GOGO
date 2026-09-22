import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeAccuracy } from "@/lib/scoring";

export default async function HistoryPage() {
  const user = await requireUser();

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id, status: "COMPLETED" },
    include: { quiz: { select: { title: true } } },
    orderBy: { completedAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Quiz History</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Every quiz you&apos;ve completed.</p>
      <div className="card elev-sm" style={{ padding: "8px 16px" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Quiz</th>
              <th>Score</th>
              <th>Accuracy</th>
              <th>Completed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => {
              const totalAnswered = a.correctCount + a.incorrectCount;
              return (
                <tr key={a.id}>
                  <td>{a.quiz.title}</td>
                  <td>{Math.round(a.totalScore)}</td>
                  <td>{Math.round(computeAccuracy(a.correctCount, totalAnswered))}%</td>
                  <td>{a.completedAt?.toLocaleDateString()}</td>
                  <td>
                    <Link href={`/quiz/attempt/${a.id}/result`} className="btn btn-ghost btn-sm">
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {attempts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  No completed quizzes yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
