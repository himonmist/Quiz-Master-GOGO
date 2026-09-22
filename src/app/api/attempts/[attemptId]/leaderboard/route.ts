import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/quiz-engine";

export async function GET(_req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { attemptId } = await params;
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId: user.id },
    include: { quiz: true },
  });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (!attempt.quiz.leaderboardVisible) {
    return NextResponse.json({ visible: false, rows: [] });
  }

  const rows = await getLeaderboard(attempt.quizId, user.id);
  const yourRow = rows.find((r) => r.isYou);

  return NextResponse.json({
    visible: true,
    quizTitle: attempt.quiz.title,
    totalQuestions: attempt.questionOrder.length,
    yourRank: yourRow?.rank ?? null,
    rows: rows.slice(0, 20),
  });
}
