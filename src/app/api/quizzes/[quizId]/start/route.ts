import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startAttempt, QuizEngineError } from "@/lib/quiz-engine";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!user.organizationId) return NextResponse.json({ error: "No organization on this account" }, { status: 403 });

  const { quizId } = await params;

  try {
    const attempt = await startAttempt(quizId, user.id, user.organizationId);
    const { ipAddress, userAgent } = requestMeta(req);
    await writeAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: "QUIZ_STARTED",
      entityType: "QuizAttempt",
      entityId: attempt.id,
      ipAddress,
      userAgent,
      metadata: { quizId },
    });
    return NextResponse.json({ attemptId: attempt.id });
  } catch (err) {
    if (err instanceof QuizEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
