import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminOverviewPage() {
  const user = await requireUser(STAFF_ROLES);
  const organizationId = user.organizationId;

  if (!organizationId) {
    return <p className="text-muted">No organization on this account.</p>;
  }

  const [participants, liveQuizzes, completedAttempts, inProgressAttempts, suspiciousCount, totalAttempts] = await Promise.all([
    prisma.user.count({ where: { organizationId, role: "PARTICIPANT" } }),
    prisma.quiz.count({ where: { organizationId, status: "LIVE" } }),
    prisma.quizAttempt.findMany({
      where: { quiz: { organizationId }, status: "COMPLETED" },
      select: { totalScore: true, correctCount: true, incorrectCount: true, totalResponseTimeMs: true },
    }),
    prisma.quizAttempt.findMany({
      where: { quiz: { organizationId }, status: "IN_PROGRESS" },
      include: { user: { select: { fullName: true } } },
      orderBy: { totalScore: "desc" },
      take: 5,
    }),
    prisma.suspiciousEvent.count({ where: { attempt: { quiz: { organizationId } } } }),
    prisma.quizAttempt.count({ where: { quiz: { organizationId } } }),
  ]);

  const avgScore = completedAttempts.length ? completedAttempts.reduce((s, a) => s + a.totalScore, 0) / completedAttempts.length : 0;
  const totalCorrect = completedAttempts.reduce((s, a) => s + a.correctCount, 0);
  const totalAnswered = completedAttempts.reduce((s, a) => s + a.correctCount + a.incorrectCount, 0);
  const avgAccuracy = totalAnswered ? (totalCorrect / totalAnswered) * 100 : 0;
  const totalResponseMs = completedAttempts.reduce((s, a) => s + Number(a.totalResponseTimeMs), 0);
  const avgResponseSeconds = totalAnswered ? totalResponseMs / totalAnswered / 1000 : 0;
  const highestScore = completedAttempts.reduce((max, a) => Math.max(max, a.totalScore), 0);
  const completionRate = totalAttempts ? (completedAttempts.length / totalAttempts) * 100 : 0;

  const buckets = [0, 0, 0, 0, 0]; // <200, 400, 600, 800, 1000+
  for (const a of completedAttempts) {
    const idx = Math.min(4, Math.floor(a.totalScore / 200));
    buckets[idx] += 1;
  }
  const maxBucket = Math.max(1, ...buckets);

  const kpis = [
    { label: "Participants", value: participants },
    { label: "Live Quizzes", value: liveQuizzes },
    { label: "Avg Score", value: Math.round(avgScore) },
    { label: "Avg Accuracy", value: `${Math.round(avgAccuracy)}%` },
    { label: "Avg Response", value: `${avgResponseSeconds.toFixed(1)}s` },
    { label: "Highest Score", value: Math.round(highestScore) },
    { label: "Completion Rate", value: `${Math.round(completionRate)}%` },
    { label: "Suspicious Events", value: suspiciousCount },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 2 }}>Admin Dashboard</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Live overview of your organization&apos;s activity.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.label} className="card elev-sm" style={{ alignItems: "center", textAlign: "center", padding: "18px 10px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, color: "var(--color-accent-700)" }}>{k.value}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="card elev-sm" style={{ padding: "22px 24px" }}>
          <h4 style={{ marginBottom: 16 }}>Score Distribution</h4>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 140 }}>
            {buckets.map((count, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "flex-end", height: "100%" }}>
                <div style={{ width: 34, height: `${Math.max(4, (count / maxBucket) * 100)}%`, borderRadius: "8px 8px 2px 2px", background: "var(--color-accent)" }} title={`${count} attempts`} />
                <div className="text-muted" style={{ fontSize: 11 }}>{i * 200}-{i * 200 + 199}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card elev-sm" style={{ padding: "22px 24px", gap: 10 }}>
          <h4 style={{ marginBottom: 4 }}>Live Monitor</h4>
          <p className="text-muted" style={{ fontSize: 12, marginBottom: 8 }}>{inProgressAttempts.length} active right now</p>
          {inProgressAttempts.map((a, i) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-divider)", fontSize: 14 }}>
              <span>#{i + 1} {a.user.fullName}</span>
              <span style={{ fontFamily: "var(--font-heading)", color: "var(--color-accent-700)" }}>{Math.round(a.totalScore)}</span>
            </div>
          ))}
          {inProgressAttempts.length === 0 ? <p className="text-muted" style={{ fontSize: 13 }}>No one is taking a quiz right now.</p> : null}
        </div>
      </div>
    </div>
  );
}
