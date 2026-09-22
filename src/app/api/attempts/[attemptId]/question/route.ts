import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentQuestion, QuizEngineError } from "@/lib/quiz-engine";

export async function GET(_req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { attemptId } = await params;
  try {
    const view = await getCurrentQuestion(attemptId, user.id);
    return NextResponse.json(view);
  } catch (err) {
    if (err instanceof QuizEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
