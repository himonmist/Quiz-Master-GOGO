import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { questionSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !STAFF_ROLES.includes(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (!user.organizationId) return NextResponse.json({ error: "No organization on this account" }, { status: 403 });

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

  const question = await prisma.question.create({
    data: {
      organizationId: user.organizationId,
      courseId: data.courseId || undefined,
      categoryId: data.categoryId || undefined,
      type: data.type,
      text: data.text,
      imageUrl: data.imageUrl || undefined,
      difficulty: data.difficulty,
      marks: data.marks,
      timeLimitSeconds: data.timeLimitSeconds,
      negativeMarks: data.negativeMarks,
      explanation: data.explanation || undefined,
      tags: data.tags,
      createdById: user.id,
      options: {
        create: data.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, order: i })),
      },
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "QUESTION_CREATED",
    entityType: "Question",
    entityId: question.id,
  });

  return NextResponse.json({ id: question.id });
}
