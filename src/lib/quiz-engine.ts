import "server-only";
import { prisma } from "./db";
import { scoreQuestion, compareAttempts, computeAccuracy } from "./scoring";
import type { AttemptStatus, Quiz } from "@prisma/client";

const LATE_SUBMIT_GRACE_MS = 1500; // network jitter allowance past the server deadline

export class QuizEngineError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function startAttempt(quizId: string, userId: string, organizationId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, organizationId, deletedAt: null },
    include: { quizQuestions: { include: { question: { include: { options: true } } }, orderBy: { order: "asc" } } },
  });
  if (!quiz) throw new QuizEngineError("Quiz not found", 404);
  if (quiz.status !== "LIVE" && quiz.mode !== "PRACTICE") {
    throw new QuizEngineError("This quiz is not currently open", 403);
  }
  if (quiz.startAt && quiz.startAt > new Date()) throw new QuizEngineError("Quiz has not started yet", 403);
  if (quiz.endAt && quiz.endAt < new Date()) throw new QuizEngineError("Quiz has already ended", 403);
  if (quiz.quizQuestions.length === 0) throw new QuizEngineError("This quiz has no questions yet", 409);

  // Reconnection support (spec §18): resume the live attempt instead of
  // starting over, and make double-click / duplicate-tab start requests
  // idempotent (spec §43).
  const inProgress = await prisma.quizAttempt.findFirst({
    where: { quizId, userId, status: "IN_PROGRESS" },
  });
  if (inProgress) return inProgress;

  const attemptCount = await prisma.quizAttempt.count({ where: { quizId, userId } });
  if (attemptCount >= quiz.attemptLimit) {
    throw new QuizEngineError("You have used all of your attempts for this quiz", 403);
  }

  const orderedQuestions = quiz.randomQuestionOrder ? shuffle(quiz.quizQuestions) : quiz.quizQuestions;
  const questionIds = orderedQuestions.map((qq) => qq.questionId);

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.quizAttempt.create({
      data: {
        quizId,
        userId,
        attemptNumber: attemptCount + 1,
        status: "IN_PROGRESS",
        questionOrder: questionIds,
        currentQuestionIndex: 0,
        startedAt: new Date(),
      },
    });

    await tx.quizAttemptQuestion.createMany({
      data: orderedQuestions.map((qq, index) => ({
        attemptId: created.id,
        questionId: qq.questionId,
        order: index,
        optionOrder: quiz.randomAnswerOrder
          ? shuffle(qq.question.options).map((o) => o.id)
          : qq.question.options.sort((a, b) => a.order - b.order).map((o) => o.id),
      })),
    });

    return created;
  });

  return attempt;
}

export interface CurrentQuestionView {
  status: "question" | "completed";
  quizTitle: string;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  questionId?: string;
  text?: string;
  imageUrl?: string | null;
  type?: string;
  options?: { id: string; text: string }[];
  serverNowMs?: number;
  deadlineMs?: number;
}

/**
 * Advances past any question whose server deadline has already elapsed
 * without an answer (auto-timeout), then returns the attempt's current
 * question — starting its server-side timer on first view (spec §17).
 */
export async function getCurrentQuestion(attemptId: string, userId: string): Promise<CurrentQuestionView> {
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId },
    include: { quiz: true },
  });
  if (!attempt) throw new QuizEngineError("Attempt not found", 404);

  if (attempt.status === "COMPLETED" || attempt.status === "ABANDONED") {
    return {
      status: "completed",
      quizTitle: attempt.quiz.title,
      questionNumber: attempt.questionOrder.length,
      totalQuestions: attempt.questionOrder.length,
      score: attempt.totalScore,
    };
  }

  const quiz = attempt.quiz;
  let index = attempt.currentQuestionIndex;
  let currentAttempt: typeof attempt = attempt;

  // Resolve any question whose timer already ran out server-side.
  for (;;) {
    if (index >= currentAttempt.questionOrder.length) {
      await finalizeAttempt(currentAttempt.id);
      const finalAttempt = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: currentAttempt.id } });
      return {
        status: "completed",
        quizTitle: quiz.title,
        questionNumber: finalAttempt.questionOrder.length,
        totalQuestions: finalAttempt.questionOrder.length,
        score: finalAttempt.totalScore,
      };
    }

    const questionId = currentAttempt.questionOrder[index];
    const aq = await prisma.quizAttemptQuestion.findUniqueOrThrow({
      where: { attemptId_questionId: { attemptId: currentAttempt.id, questionId } },
    });

    if (aq.status === "PENDING" && aq.serverDeadlineAt && aq.serverDeadlineAt.getTime() + LATE_SUBMIT_GRACE_MS < Date.now()) {
      await recordTimeout(currentAttempt.id, aq.id);
      const refreshed = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: currentAttempt.id } });
      currentAttempt = { ...refreshed, quiz };
      index = currentAttempt.currentQuestionIndex;
      continue;
    }

    const question = await prisma.question.findUniqueOrThrow({
      where: { id: questionId },
      include: { options: true },
    });

    // Lazily start the server timer for this question the first time it's fetched.
    let resolvedAq = aq;
    if (!aq.serverStartedAt) {
      const timeLimitSeconds = question.timeLimitSeconds || quiz.perQuestionTimeSeconds;
      const startedAt = new Date();
      const deadlineAt = new Date(startedAt.getTime() + timeLimitSeconds * 1000);
      resolvedAq = await prisma.quizAttemptQuestion.update({
        where: { id: aq.id },
        data: { serverStartedAt: startedAt, serverDeadlineAt: deadlineAt },
      });
    }

    const optionsById = new Map(question.options.map((o) => [o.id, o]));
    const orderedOptions = resolvedAq.optionOrder
      .map((id) => optionsById.get(id))
      .filter((o): o is NonNullable<typeof o> => !!o);

    return {
      status: "question",
      quizTitle: quiz.title,
      questionNumber: index + 1,
      totalQuestions: currentAttempt.questionOrder.length,
      score: currentAttempt.totalScore,
      questionId: question.id,
      text: question.text,
      imageUrl: question.imageUrl,
      type: question.type,
      options: orderedOptions.map((o) => ({ id: o.id, text: o.text })),
      serverNowMs: Date.now(),
      deadlineMs: resolvedAq.serverDeadlineAt!.getTime(),
    };
  }
}

async function recordTimeout(attemptId: string, attemptQuestionId: string) {
  const aq = await prisma.quizAttemptQuestion.findUniqueOrThrow({ where: { id: attemptQuestionId } });
  await prisma.$transaction([
    prisma.quizAttemptQuestion.update({
      where: { id: attemptQuestionId },
      data: { status: "TIMED_OUT", submittedAt: new Date() },
    }),
    prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        unansweredCount: { increment: 1 },
        currentQuestionIndex: { increment: 1 },
        totalResponseTimeMs: { increment: BigInt(aq.serverDeadlineAt ? aq.serverDeadlineAt.getTime() - (aq.serverStartedAt?.getTime() ?? aq.serverDeadlineAt.getTime()) : 0) },
      },
    }),
  ]);
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  questionScore: number;
  baseScore: number;
  speedScore: number;
  totalScore: number;
  correctOptionIds?: string[];
  attemptCompleted: boolean;
}

export async function submitAnswer(
  attemptId: string,
  userId: string,
  selectedOptionIds: string[]
): Promise<SubmitAnswerResult> {
  const attempt = await prisma.quizAttempt.findFirst({ where: { id: attemptId, userId }, include: { quiz: true } });
  if (!attempt) throw new QuizEngineError("Attempt not found", 404);
  if (attempt.status !== "IN_PROGRESS") throw new QuizEngineError("This attempt is not in progress", 409);

  const index = attempt.currentQuestionIndex;
  if (index >= attempt.questionOrder.length) throw new QuizEngineError("No question is currently active", 409);

  const questionId = attempt.questionOrder[index];
  const aq = await prisma.quizAttemptQuestion.findUniqueOrThrow({
    where: { attemptId_questionId: { attemptId, questionId } },
    include: { answer: true },
  });

  // Idempotent: a duplicate submit (double-click, retried request) returns
  // the already-recorded result instead of re-scoring (spec §16, §43).
  if (aq.answer) {
    return {
      isCorrect: aq.answer.isCorrect,
      questionScore: aq.answer.questionScore,
      baseScore: aq.answer.baseScore,
      speedScore: aq.answer.speedScore,
      totalScore: attempt.totalScore,
      attemptCompleted: attempt.status !== "IN_PROGRESS",
    };
  }

  if (!aq.serverStartedAt || !aq.serverDeadlineAt) {
    throw new QuizEngineError("Question timer has not started yet", 409);
  }

  const now = new Date();
  const isLate = now.getTime() > aq.serverDeadlineAt.getTime() + LATE_SUBMIT_GRACE_MS;
  if (isLate) {
    await recordTimeout(attemptId, aq.id);
    return {
      isCorrect: false,
      questionScore: 0,
      baseScore: 0,
      speedScore: 0,
      totalScore: attempt.totalScore,
      attemptCompleted: false,
    };
  }

  const question = await prisma.question.findUniqueOrThrow({ where: { id: questionId }, include: { options: true } });
  const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
  const selectedSet = new Set(selectedOptionIds);
  const isCorrect =
    selectedSet.size === correctIds.size && [...selectedSet].every((id) => correctIds.has(id));

  // Response time is measured strictly server-side; the client's own
  // countdown is a display only and is never trusted for scoring (spec §17).
  const responseTimeMs = Math.min(now.getTime() - aq.serverStartedAt.getTime(), aq.serverDeadlineAt.getTime() - aq.serverStartedAt.getTime());
  const timeLimitSeconds = question.timeLimitSeconds || attempt.quiz.perQuestionTimeSeconds;

  const result = scoreQuestion({
    isCorrect,
    responseTimeMs,
    maxTimeMs: timeLimitSeconds * 1000,
    accuracyWeight: attempt.quiz.accuracyWeightPercent,
    speedWeight: attempt.quiz.speedWeightPercent,
    difficulty: question.difficulty,
    difficultyWeightingEnabled: attempt.quiz.difficultyWeightingEnabled,
    speedBonusEnabled: attempt.quiz.speedBonusEnabled,
    negativeMarking: attempt.quiz.negativeMarking,
    negativeMarks: question.negativeMarks,
  });

  const nextIndex = index + 1;
  const isLastQuestion = nextIndex >= attempt.questionOrder.length;

  const updatedAttempt = await prisma.$transaction(async (tx) => {
    await tx.answer.create({
      data: {
        attemptId,
        attemptQuestionId: aq.id,
        questionId,
        selectedOptionIds,
        isCorrect,
        responseTimeMs,
        baseScore: result.baseScore,
        speedScore: result.speedScore,
        difficultyMultiplier: result.difficultyMultiplier,
        questionScore: result.questionScore,
      },
    });
    await tx.quizAttemptQuestion.update({
      where: { id: aq.id },
      data: { status: "ANSWERED", submittedAt: now },
    });
    return tx.quizAttempt.update({
      where: { id: attemptId },
      data: {
        totalScore: { increment: result.questionScore },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        incorrectCount: !isCorrect ? { increment: 1 } : undefined,
        totalResponseTimeMs: { increment: BigInt(responseTimeMs) },
        currentQuestionIndex: { increment: 1 },
        status: isLastQuestion ? "COMPLETED" : undefined,
        completedAt: isLastQuestion ? now : undefined,
      },
    });
  });

  const revealAnswer = attempt.quiz.resultVisibility === "IMMEDIATE";

  if (updatedAttempt.status === "COMPLETED") {
    await issueCertificateIfEligible(updatedAttempt.id);
  }

  return {
    isCorrect,
    questionScore: result.questionScore,
    baseScore: result.baseScore,
    speedScore: result.speedScore,
    totalScore: updatedAttempt.totalScore,
    correctOptionIds: revealAnswer ? [...correctIds] : undefined,
    attemptCompleted: updatedAttempt.status === "COMPLETED",
  };
}

function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CERT-${year}-${suffix}`;
}

/** Issues a certificate once, the first time an attempt completes with a passing score (spec §24). */
async function issueCertificateIfEligible(attemptId: string) {
  const attempt = await prisma.quizAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { quiz: true },
  });
  if (attempt.totalScore < attempt.quiz.passingScore) return;

  const existing = await prisma.certificate.findUnique({ where: { attemptId } });
  if (existing) return;

  const rankedAbove = await prisma.quizAttempt.count({
    where: { quizId: attempt.quizId, status: "COMPLETED", totalScore: { gt: attempt.totalScore } },
  });

  await prisma.certificate.create({
    data: {
      certificateCode: generateCertificateCode(),
      organizationId: attempt.quiz.organizationId,
      userId: attempt.userId,
      courseId: attempt.quiz.courseId,
      quizId: attempt.quizId,
      attemptId: attempt.id,
      score: attempt.totalScore,
      rank: rankedAbove + 1,
    },
  });
}

async function finalizeAttempt(attemptId: string) {
  await prisma.quizAttempt.updateMany({
    where: { id: attemptId, status: "IN_PROGRESS" },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  await issueCertificateIfEligible(attemptId);
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  accuracy: number;
  avgResponseSeconds: number;
  isYou: boolean;
  status: AttemptStatus;
}

export async function getLeaderboard(quizId: string, forUserId: string, limit = 50): Promise<LeaderboardRow[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
    include: { user: { select: { id: true, fullName: true } } },
  });

  const ranked = [...attempts]
    .map((a) => ({
      attempt: a,
      totalAnswered: a.correctCount + a.incorrectCount,
    }))
    .sort((x, y) =>
      compareAttempts(
        {
          totalScore: x.attempt.totalScore,
          correctCount: x.attempt.correctCount,
          totalAnswered: x.totalAnswered,
          totalResponseTimeMs: Number(x.attempt.totalResponseTimeMs),
          completedAt: x.attempt.completedAt,
        },
        {
          totalScore: y.attempt.totalScore,
          correctCount: y.attempt.correctCount,
          totalAnswered: y.totalAnswered,
          totalResponseTimeMs: Number(y.attempt.totalResponseTimeMs),
          completedAt: y.attempt.completedAt,
        }
      )
    );

  return ranked.slice(0, limit).map((row, i) => ({
    rank: i + 1,
    userId: row.attempt.userId,
    displayName: row.attempt.user.fullName,
    score: Math.round(row.attempt.totalScore),
    accuracy: row.totalAnswered > 0 ? Math.round((row.attempt.correctCount / row.totalAnswered) * 100) : 0,
    avgResponseSeconds: row.totalAnswered > 0 ? Number(row.attempt.totalResponseTimeMs) / row.totalAnswered / 1000 : 0,
    isYou: row.attempt.userId === forUserId,
    status: row.attempt.status,
  }));
}

export interface AttemptResult {
  quizTitle: string;
  finalScore: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  avgResponseSeconds: number;
  totalTimeSeconds: number;
  rank: number;
  totalParticipants: number;
  percentile: number;
  passed: boolean;
  review?: {
    questionId: string;
    text: string;
    yourAnswer: string[];
    correctAnswer: string[];
    options: { id: string; text: string }[];
    isCorrect: boolean;
    questionScore: number;
    responseTimeMs: number;
    explanation: string | null;
  }[];
}

export async function getAttemptResult(attemptId: string, userId: string): Promise<AttemptResult> {
  const attempt = await prisma.quizAttempt.findFirst({ where: { id: attemptId, userId }, include: { quiz: true } });
  if (!attempt) throw new QuizEngineError("Attempt not found", 404);
  if (attempt.status !== "COMPLETED") throw new QuizEngineError("This attempt is not finished yet", 409);

  const allAttempts = await prisma.quizAttempt.findMany({ where: { quizId: attempt.quizId, status: "COMPLETED" } });
  const ranked = allAttempts
    .map((a) => ({
      id: a.id,
      totalScore: a.totalScore,
      correctCount: a.correctCount,
      totalAnswered: a.correctCount + a.incorrectCount,
      totalResponseTimeMs: Number(a.totalResponseTimeMs),
      completedAt: a.completedAt,
    }))
    .sort(compareAttempts);
  const rank = ranked.findIndex((a) => a.id === attempt.id) + 1;
  const percentile = ranked.length > 1 ? Math.round(((ranked.length - rank) / (ranked.length - 1)) * 100) : 100;

  const totalAnswered = attempt.correctCount + attempt.incorrectCount;
  const unanswered = attempt.questionOrder.length - totalAnswered;
  const totalTimeMs =
    attempt.completedAt && attempt.startedAt ? attempt.completedAt.getTime() - attempt.startedAt.getTime() : 0;

  const revealNow =
    attempt.quiz.resultVisibility === "IMMEDIATE" ||
    attempt.quiz.resultVisibility === "AFTER_QUIZ" ||
    (attempt.quiz.resultVisibility === "AFTER_COMPETITION" && ["COMPLETED", "ARCHIVED"].includes(attempt.quiz.status));

  let review: AttemptResult["review"];
  if (revealNow) {
    const answers = await prisma.answer.findMany({
      where: { attemptId },
      include: { question: { include: { options: true } } },
      orderBy: { createdAt: "asc" },
    });
    review = answers.map((a) => ({
      questionId: a.questionId,
      text: a.question.text,
      yourAnswer: a.selectedOptionIds,
      correctAnswer: a.question.options.filter((o) => o.isCorrect).map((o) => o.id),
      options: a.question.options.map((o) => ({ id: o.id, text: o.text })),
      isCorrect: a.isCorrect,
      questionScore: a.questionScore,
      responseTimeMs: a.responseTimeMs,
      explanation: a.question.explanation,
    }));
  }

  return {
    quizTitle: attempt.quiz.title,
    finalScore: Math.round(attempt.totalScore),
    accuracy: Math.round(computeAccuracy(attempt.correctCount, totalAnswered)),
    correctCount: attempt.correctCount,
    incorrectCount: attempt.incorrectCount,
    unansweredCount: unanswered,
    avgResponseSeconds: totalAnswered > 0 ? Number(attempt.totalResponseTimeMs) / totalAnswered / 1000 : 0,
    totalTimeSeconds: Math.round(totalTimeMs / 1000),
    rank,
    totalParticipants: ranked.length,
    percentile,
    passed: attempt.totalScore >= attempt.quiz.passingScore,
    review,
  };
}

export async function getQuizForOrg(quizId: string, organizationId: string, includeQuestions = false) {
  return prisma.quiz.findFirst({
    where: { id: quizId, organizationId, deletedAt: null },
    include: includeQuestions
      ? { quizQuestions: { include: { question: { include: { options: true } } }, orderBy: { order: "asc" } } }
      : undefined,
  });
}

export type { Quiz };
