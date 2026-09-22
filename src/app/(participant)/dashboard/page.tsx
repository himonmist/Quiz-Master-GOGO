import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeAccuracy } from "@/lib/scoring";

function statusLabel(status: string, startAt: Date | null) {
  if (status === "LIVE") return "Live";
  if (status === "SCHEDULED") return startAt ? `Starts ${startAt.toLocaleString()}` : "Upcoming";
  if (status === "COMPLETED") return "Completed";
  return status;
}

export default async function DashboardPage() {
  const user = await requireUser();

  const quizzes = user.organizationId
    ? await prisma.quiz.findMany({
        where: { organizationId: user.organizationId, deletedAt: null, status: { in: ["SCHEDULED", "LIVE", "COMPLETED"] } },
        include: {
          course: { select: { title: true } },
          _count: { select: { quizQuestions: true } },
          attempts: { where: { userId: user.id } },
        },
        orderBy: [{ status: "asc" }, { startAt: "asc" }],
        take: 20,
      })
    : [];

  const completedAttempts = quizzes.flatMap((q) => q.attempts.filter((a) => a.status === "COMPLETED"));
  const totalAnswered = completedAttempts.reduce((sum, a) => sum + a.correctCount + a.incorrectCount, 0);
  const totalCorrect = completedAttempts.reduce((sum, a) => sum + a.correctCount, 0);
  const accuracy = Math.round(computeAccuracy(totalCorrect, totalAnswered));
  const liveCount = quizzes.filter((q) => q.status === "LIVE").length;

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Good day, {user.fullName.split(" ")[0]}</h2>
      <p className="text-muted" style={{ marginBottom: 28 }}>Ready for your next challenge?</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14, marginBottom: 28 }}>
        <div className="card elev-sm" style={{ alignItems: "center", textAlign: "center", padding: "20px 12px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent-700)" }}>{quizzes.length}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>Quizzes</div>
        </div>
        <div className="card elev-sm" style={{ alignItems: "center", textAlign: "center", padding: "20px 12px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent-700)" }}>{liveCount}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>Live</div>
        </div>
        <div className="card elev-sm" style={{ alignItems: "center", textAlign: "center", padding: "20px 12px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent-700)" }}>{accuracy}%</div>
          <div className="text-muted" style={{ fontSize: 12 }}>Accuracy</div>
        </div>
        <div className="card elev-sm" style={{ alignItems: "center", textAlign: "center", padding: "20px 12px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: 28, color: "var(--color-accent-700)" }}>{completedAttempts.length}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>Completed</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 14 }}>Assigned Quizzes</h3>
      {quizzes.length === 0 ? (
        <div className="card elev-sm" style={{ padding: 24 }}>
          <p className="card-body" style={{ margin: 0 }}>No quizzes have been assigned yet — check back soon.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {quizzes.map((q) => {
            const lastAttempt = q.attempts.at(-1);
            const usedAll = q.attempts.length >= q.attemptLimit;
            const canJoin = q.status === "LIVE" && (!usedAll || lastAttempt?.status === "IN_PROGRESS");
            return (
              <div key={q.id} className="card elev-md" style={{ padding: "22px 24px", gap: 8 }}>
                <div className="card-kicker">{q.course.title}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{q.title}</h3>
                    <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>
                      {q._count.quizQuestions} Questions · {q.mode === "COMPETITION" ? "Live Competition" : "Practice"} ·{" "}
                      {Math.round((q._count.quizQuestions * q.perQuestionTimeSeconds) / 60)} min
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="tag tag-neutral">{statusLabel(q.status, q.startAt)}</span>
                    {lastAttempt?.status === "COMPLETED" ? (
                      <Link href={`/quiz/attempt/${lastAttempt.id}/result`} className="btn btn-secondary">
                        View Result
                      </Link>
                    ) : lastAttempt?.status === "IN_PROGRESS" ? (
                      <Link href={`/quiz/attempt/${lastAttempt.id}`} className="btn btn-primary">
                        Resume →
                      </Link>
                    ) : canJoin ? (
                      <Link href={`/quiz/${q.id}/lobby`} className="btn btn-primary">
                        Join Quiz →
                      </Link>
                    ) : (
                      <button className="btn btn-secondary" disabled>
                        {usedAll ? "No attempts left" : "Locked"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
