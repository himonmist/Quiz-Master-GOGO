import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getAttemptResult } from "@/lib/quiz-engine";
import { ResultReview } from "@/components/ResultReview";

export default async function AttemptResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser();
  const { attemptId } = await params;
  const result = await getAttemptResult(attemptId, user.id);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card elev-lg" style={{ width: "min(560px, 100%)", padding: "44px 40px", gap: 8, textAlign: "center", alignItems: "center" }}>
        <span className="tag tag-accent-2" style={{ marginBottom: 10 }}>
          {result.passed ? "Quiz Completed" : "Quiz Completed"}
        </span>
        <h1 style={{ marginBottom: 2 }}>{result.passed ? "Excellent Work!" : "Quiz Completed"}</h1>
        <p className="text-muted" style={{ marginBottom: 20 }}>{result.quizTitle}</p>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 56, color: "var(--color-accent-700)" }}>{result.finalScore}</div>
        <div className="text-muted" style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 22 }}>
          Final Score
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", marginBottom: 12 }}>
          <div className="card elev-sm" style={{ padding: 16, alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>#{result.rank}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Rank</div>
          </div>
          <div className="card elev-sm" style={{ padding: 16, alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{result.accuracy}%</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Accuracy</div>
          </div>
          <div className="card elev-sm" style={{ padding: 16, alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>
              {result.correctCount}/{result.correctCount + result.incorrectCount + result.unansweredCount}
            </div>
            <div className="text-muted" style={{ fontSize: 12 }}>Correct</div>
          </div>
          <div className="card elev-sm" style={{ padding: 16, alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 22 }}>{result.avgResponseSeconds.toFixed(1)}s</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Avg Response Time</div>
          </div>
        </div>

        <p className="text-muted" style={{ fontSize: 12, marginBottom: 22 }}>
          Total time {Math.floor(result.totalTimeSeconds / 60)}m {result.totalTimeSeconds % 60}s · Percentile {result.percentile} · {result.totalParticipants} participants
        </p>

        <ResultReview review={result.review} />

        <Link href={`/quiz/attempt/${attemptId}/leaderboard`} className="btn btn-secondary btn-block" style={{ fontSize: 15, padding: 13, marginTop: 10 }}>
          View Leaderboard
        </Link>
        <Link href="/dashboard" className="text-muted" style={{ fontSize: 13, marginTop: 14, textDecoration: "none" }}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
