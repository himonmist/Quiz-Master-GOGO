"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, ADMIN_ROLES, STAFF_ROLES } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { courseSchema } from "@/lib/validation";

export async function createCourse(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser(STAFF_ROLES);
  if (!user.organizationId) return { error: "No organization on this account" };

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    instructor: formData.get("instructor"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const course = await prisma.course.create({
    data: {
      organizationId: user.organizationId,
      title: parsed.data.title,
      description: parsed.data.description || undefined,
      instructor: parsed.data.instructor || undefined,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      status: "ACTIVE",
    },
  });

  await writeAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "COURSE_CREATED",
    entityType: "Course",
    entityId: course.id,
  });
  revalidatePath("/admin/courses");
  return { ok: true };
}

export async function setCourseStatus(courseId: string, status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED") {
  const user = await requireUser(STAFF_ROLES);
  if (!user.organizationId) return;
  await prisma.course.updateMany({ where: { id: courseId, organizationId: user.organizationId }, data: { status } });
  await writeAuditLog({ organizationId: user.organizationId, userId: user.id, action: "COURSE_UPDATED", entityType: "Course", entityId: courseId, metadata: { status } });
  revalidatePath("/admin/courses");
}

export async function setQuizStatus(quizId: string, status: "DRAFT" | "SCHEDULED" | "LIVE" | "COMPLETED" | "ARCHIVED") {
  const user = await requireUser(STAFF_ROLES);
  if (!user.organizationId) return;
  await prisma.quiz.updateMany({ where: { id: quizId, organizationId: user.organizationId }, data: { status } });
  await writeAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUIZ_UPDATED", entityType: "Quiz", entityId: quizId, metadata: { status } });
  revalidatePath("/admin/quizzes");
}

export async function deleteQuestion(questionId: string) {
  const user = await requireUser(STAFF_ROLES);
  if (!user.organizationId) return;
  await prisma.question.updateMany({
    where: { id: questionId, organizationId: user.organizationId },
    data: { deletedAt: new Date(), isActive: false },
  });
  await writeAuditLog({ organizationId: user.organizationId, userId: user.id, action: "QUESTION_DELETED", entityType: "Question", entityId: questionId });
  revalidatePath("/admin/questions");
}

export async function setUserActive(userId: string, isActive: boolean) {
  const admin = await requireUser(ADMIN_ROLES);
  if (!admin.organizationId) return;
  await prisma.user.updateMany({ where: { id: userId, organizationId: admin.organizationId }, data: { isActive } });
  if (!isActive) {
    await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await writeAuditLog({
    organizationId: admin.organizationId,
    userId: admin.id,
    action: isActive ? "USER_REACTIVATED" : "USER_SUSPENDED",
    entityType: "User",
    entityId: userId,
  });
  revalidatePath("/admin/participants");
}

export async function createCategory(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser(STAFF_ROLES);
  if (!user.organizationId) return { error: "No organization on this account" };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required" };

  await prisma.category.upsert({
    where: { organizationId_name: { organizationId: user.organizationId, name } },
    create: { organizationId: user.organizationId, name },
    update: {},
  });
  revalidatePath("/admin/questions");
  revalidatePath("/admin/questions/new");
  return { ok: true };
}
