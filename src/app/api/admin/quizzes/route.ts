import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { quizSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !STAFF_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!user.organizationId) return NextResponse.json({ error: "No organization on this account" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = quizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  const course = await prisma.course.findFirst({ where: { id: data.courseId, organizationId: user.organizationId } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const questions = await prisma.question.findMany({
    where: { id: { in: data.questionIds }, organizationId: user.organizationId, deletedAt: null },
  });
  if (questions.length !== data.questionIds.length) {
    return NextResponse.json({ error: "One or more selected questions were not found" }, { status: 400 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      organizationId: user.organizationId,
      courseId: data.courseId,
      title: data.title,
      description: data.description || undefined,
      difficulty: data.difficulty,
      numQuestions: data.questionIds.length,
      perQuestionTimeSeconds: data.perQuestionTimeSeconds,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
      attemptLimit: data.attemptLimit,
      passingScore: data.passingScore,
      mode: data.mode,
      competitionMode: data.competitionMode,
      randomQuestionOrder: data.randomQuestionOrder,
      randomAnswerOrder: data.randomAnswerOrder,
      negativeMarking: data.negativeMarking,
      speedBonusEnabled: data.speedBonusEnabled,
      difficultyWeightingEnabled: data.difficultyWeightingEnabled,
      accuracyWeightPercent: data.accuracyWeightPercent,
      speedWeightPercent: data.speedWeightPercent,
      leaderboardVisible: data.leaderboardVisible,
      resultVisibility: data.resultVisibility,
      status: "DRAFT",
      createdById: user.id,
      quizQuestions: {
        create: data.questionIds.map((questionId, i) => ({ questionId, order: i })),
      },
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "QUIZ_CREATED",
    entityType: "Quiz",
    entityId: quiz.id,
  });

  return NextResponse.json({ id: quiz.id });
}
