import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { suspiciousEventSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { attemptId } = await params;

  const limited = rateLimit(`suspicious:${attemptId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ ok: true }); // silently drop excess events, never break the quiz flow

  const body = await req.json().catch(() => null);
  const parsed = suspiciousEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const attempt = await prisma.quizAttempt.findFirst({ where: { id: attemptId, userId: user.id } });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

  // A single flagged event never disqualifies anyone (spec §16) — this only
  // records it for an admin to review later.
  await prisma.suspiciousEvent.create({
    data: {
      attemptId,
      userId: user.id,
      type: parsed.data.type,
      metadata: parsed.data.metadata as never,
    },
  });

  return NextResponse.json({ ok: true });
}
