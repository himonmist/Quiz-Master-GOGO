import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getQuizForOrg } from "@/lib/quiz-engine";

export async function GET(_req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!user.organizationId) return NextResponse.json({ error: "No organization on this account" }, { status: 403 });

  const { quizId } = await params;
  const quiz = await getQuizForOrg(quizId, user.organizationId);
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  return NextResponse.json({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    numQuestions: quiz.numQuestions,
    perQuestionTimeSeconds: quiz.perQuestionTimeSeconds,
    mode: quiz.mode,
    competitionMode: quiz.competitionMode,
    status: quiz.status,
    startAt: quiz.startAt,
    endAt: quiz.endAt,
    attemptLimit: quiz.attemptLimit,
    negativeMarking: quiz.negativeMarking,
    accuracyWeightPercent: quiz.accuracyWeightPercent,
    speedWeightPercent: quiz.speedWeightPercent,
    leaderboardVisible: quiz.leaderboardVisible,
  });
}
