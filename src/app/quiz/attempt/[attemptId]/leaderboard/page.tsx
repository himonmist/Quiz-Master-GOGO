import { requireUser } from "@/lib/auth";
import { LiveLeaderboardClient } from "@/components/LiveLeaderboardClient";

export default async function AttemptLeaderboardPage({ params }: { params: Promise<{ attemptId: string }> }) {
  await requireUser();
  const { attemptId } = await params;
  return <LiveLeaderboardClient attemptId={attemptId} />;
}
