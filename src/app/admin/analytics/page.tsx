import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminAnalyticsPage() {
  const user = await requireUser(STAFF_ROLES);
  const organizationId = user.organizationId;
  if (!organizationId) return <p className="text-muted">No organization on this account.</p>;

  const questions = await prisma.question.findMany({
    where: { organizationId, deletedAt: null },
    include: { answers: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const questionStats = questions
    .filter((q) => q.answers.length > 0)
    .map((q) => {
      const attempts = q.answers.length;
      const correct = q.answers.filter((a) => a.isCorrect).length;
      const avgTimeMs = q.answers.reduce((s, a) => s + a.responseTimeMs, 0) / attempts;
      return {
        id: q.id,
        text: q.text,
        difficulty: q.difficulty,
        attempts,
        accuracy: (correct / attempts) * 100,
        avgTimeSeconds: avgTimeMs / 1000,
      };
    });

  const hardest = [...questionStats].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
  const slowest = [...questionStats].sort((a, b) => b.avgTimeSeconds - a.avgTimeSeconds).slice(0, 5);

  const courses = await prisma.course.findMany({
    where: { organizationId },
    include: {
      quizzes: { include: { attempts: { where: { status: "COMPLETED" } } } },
      participants: true,
    },
  });

  const courseStats = courses.map((c) => {
    const attempts = c.quizzes.flatMap((q) => q.attempts);
    const avgScore = attempts.length ? attempts.reduce((s, a) => s + a.totalScore, 0) / attempts.length : 0;
    return { id: c.id, title: c.title, participants: c.participants.length, attempts: attempts.length, avgScore };
  });

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Analytics</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Question and course performance across your organization.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div className="card elev-sm" style={{ padding: "20px 22px" }}>
          <h4 style={{ marginBottom: 12 }}>Most Difficult Questions</h4>
          {hardest.map((q) => (
            <div key={q.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)", fontSize: 13 }}>
              <div>{q.text}</div>
              <div className="text-muted">{Math.round(q.accuracy)}% correct · {q.attempts} attempts</div>
            </div>
          ))}
          {hardest.length === 0 ? <p className="text-muted" style={{ fontSize: 13 }}>Not enough data yet.</p> : null}
        </div>
        <div className="card elev-sm" style={{ padding: "20px 22px" }}>
          <h4 style={{ marginBottom: 12 }}>Slowest Questions</h4>
          {slowest.map((q) => (
            <div key={q.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)", fontSize: 13 }}>
              <div>{q.text}</div>
              <div className="text-muted">{q.avgTimeSeconds.toFixed(1)}s average · {q.attempts} attempts</div>
            </div>
          ))}
          {slowest.length === 0 ? <p className="text-muted" style={{ fontSize: 13 }}>Not enough data yet.</p> : null}
        </div>
      </div>

      <h3 style={{ marginBottom: 10 }}>Course Performance</h3>
      <div className="card elev-sm" style={{ padding: "8px 16px" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Participants</th>
              <th>Completed Attempts</th>
              <th>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {courseStats.map((c) => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>{c.participants}</td>
                <td>{c.attempts}</td>
                <td>{Math.round(c.avgScore)}</td>
              </tr>
            ))}
            {courseStats.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted">
                  No courses yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
