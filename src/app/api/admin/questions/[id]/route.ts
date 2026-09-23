import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { questionSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !STAFF_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!user.organizationId) return NextResponse.json({ error: "No organization on this account" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.question.findFirst({ where: { id, organizationId: user.organizationId, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  const correctCount = data.options.filter((o) => o.isCorrect).length;
  if (correctCount === 0) {
    return NextResponse.json({ error: "At least one option must be marked correct" }, { status: 400 });
  }
  if (data.type !== "MULTIPLE_CHOICE" && correctCount > 1) {
    return NextResponse.json({ error: "Only one option can be correct for this question type" }, { status: 400 });
  }

  // Options are replaced wholesale rather than diffed in place: simpler and
  // safe, since answers/attempt snapshots reference option ids by value in
  // plain array columns (no FK), not live relations.
  await prisma.$transaction([
    prisma.question.update({
      where: { id },
      data: {
        courseId: data.courseId || null,
        categoryId: data.categoryId || null,
        type: data.type,
        text: data.text,
        imageUrl: data.imageUrl || null,
        difficulty: data.difficulty,
        marks: data.marks,
        timeLimitSeconds: data.timeLimitSeconds,
        negativeMarks: data.negativeMarks,
        explanation: data.explanation || null,
        tags: data.tags,
      },
    }),
    prisma.questionOption.deleteMany({ where: { questionId: id } }),
    prisma.questionOption.createMany({
      data: data.options.map((o, i) => ({ questionId: id, text: o.text, isCorrect: o.isCorrect, order: i })),
    }),
  ]);

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "QUESTION_UPDATED",
    entityType: "Question",
    entityId: id,
  });

  return NextResponse.json({ id });
}
