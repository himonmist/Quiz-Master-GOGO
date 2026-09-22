import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitAnswer, QuizEngineError } from "@/lib/quiz-engine";
import { submitAnswerSchema } from "@/lib/validation";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { attemptId } = await params;

  // Belt-and-suspenders against rapid-fire duplicate submits (spec §16);
  // the engine itself is idempotent regardless.
  const limited = rateLimit(`answer:${attemptId}`, 20, 10_000);
  if (!limited.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = submitAnswerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission" }, { status: 400 });

  try {
    const result = await submitAnswer(attemptId, user.id, parsed.data.selectedOptionIds);
    const { ipAddress, userAgent } = requestMeta(req);
    await writeAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "ANSWER_SUBMITTED",
      entityType: "QuizAttempt",
      entityId: attemptId,
      ipAddress,
      userAgent,
      metadata: { isCorrect: result.isCorrect, questionScore: result.questionScore },
    });
    if (result.attemptCompleted) {
      await writeAuditLog({
        organizationId: user.organizationId,
        userId: user.id,
        action: "QUIZ_COMPLETED",
        entityType: "QuizAttempt",
        entityId: attemptId,
        ipAddress,
        userAgent,
      });
    }
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof QuizEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
