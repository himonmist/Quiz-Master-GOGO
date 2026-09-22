import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StartQuizButton } from "@/components/StartQuizButton";

export default async function QuizLobbyPage({ params }: { params: Promise<{ quizId: string }> }) {
  const user = await requireUser();
  const { quizId } = await params;

  const quiz = user.organizationId
    ? await prisma.quiz.findFirst({
        where: { id: quizId, organizationId: user.organizationId, deletedAt: null },
        include: { course: { select: { title: true } }, _count: { select: { quizQuestions: true } } },
      })
    : null;
  if (!quiz) notFound();

  const totalMinutes = Math.round((quiz._count.quizQuestions * quiz.perQuestionTimeSeconds) / 60);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card elev-md" style={{ width: "min(520px, 100%)", padding: "40px 36px", gap: 10 }}>
        <div className="card-kicker">{quiz.course.title}</div>
        <h2 style={{ marginBottom: 2 }}>{quiz.title}</h2>
        {quiz.description ? <p className="text-muted" style={{ marginBottom: 10 }}>{quiz.description}</p> : null}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "10px 0 18px" }}>
          <div className="card elev-sm" style={{ padding: 14, alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>{quiz._count.quizQuestions}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Questions</div>
          </div>
          <div className="card elev-sm" style={{ padding: 14, alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: 20 }}>~{totalMinutes} min</div>
            <div className="text-muted" style={{ fontSize: 12 }}>Total time</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          <span className="tag tag-accent-2">
            Accuracy {quiz.accuracyWeightPercent}% + Speed {quiz.speedWeightPercent}%
          </span>
          <span className="tag tag-neutral">{quiz.mode === "COMPETITION" ? "Live Competition" : "Practice Mode"}</span>
          {quiz.negativeMarking ? <span className="tag tag-outline">Negative marking on</span> : null}
        </div>

        <ul style={{ fontSize: 13, opacity: 0.85, paddingLeft: 18, marginBottom: 20 }}>
          <li>Each question has its own countdown timer, enforced by the server.</li>
          <li>Once you submit an answer it is locked — you cannot change it.</li>
          <li>Your rank updates after every question you answer.</li>
          <li>Leaving and returning will resume your quiz where you left off.</li>
        </ul>

        <StartQuizButton quizId={quiz.id} />
        <Link href="/dashboard" className="text-muted" style={{ fontSize: 13, textAlign: "center", display: "block", marginTop: 14 }}>
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
