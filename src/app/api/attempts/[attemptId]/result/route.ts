import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAttemptResult, QuizEngineError } from "@/lib/quiz-engine";

export async function GET(_req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { attemptId } = await params;
  try {
    const result = await getAttemptResult(attemptId, user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof QuizEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
