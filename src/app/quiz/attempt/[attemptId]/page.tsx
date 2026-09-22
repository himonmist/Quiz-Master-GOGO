import { requireUser } from "@/lib/auth";
import { QuizAttemptClient } from "@/components/QuizAttemptClient";

export default async function QuizAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  await requireUser();
  const { attemptId } = await params;
  return <QuizAttemptClient attemptId={attemptId} />;
}
