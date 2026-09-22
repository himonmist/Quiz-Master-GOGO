import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Participant-facing quiz list, scoped to the caller's organization
// (tenant isolation) and excluding drafts/archived quizzes.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!user.organizationId) return NextResponse.json({ quizzes: [] });

  const quizzes = await prisma.quiz.findMany({
    where: {
      organizationId: user.organizationId,
      deletedAt: null,
      status: { in: ["SCHEDULED", "LIVE", "COMPLETED"] },
    },
    include: {
      course: { select: { title: true } },
      _count: { select: { quizQuestions: true } },
      attempts: { where: { userId: user.id }, select: { id: true, status: true, totalScore: true } },
    },
    orderBy: [{ status: "asc" }, { startAt: "asc" }],
  });

  return NextResponse.json({
    quizzes: quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      courseName: q.course.title,
      status: q.status,
      mode: q.mode,
      competitionMode: q.competitionMode,
      startAt: q.startAt,
      endAt: q.endAt,
      numQuestions: q._count.quizQuestions,
      perQuestionTimeSeconds: q.perQuestionTimeSeconds,
      attemptLimit: q.attemptLimit,
      attemptsUsed: q.attempts.length,
      lastAttemptStatus: q.attempts.at(-1)?.status ?? null,
      lastScore: q.attempts.at(-1)?.totalScore ?? null,
    })),
  });
}
