"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, SUPER_ADMIN_ROLES } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { organizationSchema } from "@/lib/validation";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80) || "org"
  );
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let n = 1;
  for (;;) {
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function createOrganization(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser(SUPER_ADMIN_ROLES);
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const slug = await uniqueSlug(slugify(parsed.data.name));
  const org = await prisma.organization.create({
    data: { name: parsed.data.name, slug, description: parsed.data.description || undefined },
  });

  await writeAuditLog({ userId: user.id, action: "ORGANIZATION_CREATED", entityType: "Organization", entityId: org.id });
  revalidatePath("/admin/organizations");
  revalidatePath("/register");
  return { ok: true };
}

export async function updateOrganization(orgId: string, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser(SUPER_ADMIN_ROLES);
  const parsed = organizationSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!existing) return { error: "Organization not found" };

  const slug = existing.name === parsed.data.name ? existing.slug : await uniqueSlug(slugify(parsed.data.name), orgId);

  await prisma.organization.update({
    where: { id: orgId },
    data: { name: parsed.data.name, slug, description: parsed.data.description || undefined },
  });

  await writeAuditLog({ userId: user.id, action: "ORGANIZATION_UPDATED", entityType: "Organization", entityId: orgId });
  revalidatePath("/admin/organizations");
  revalidatePath("/register");
  return { ok: true };
}

export async function setOrganizationActive(orgId: string, isActive: boolean) {
  const user = await requireUser(SUPER_ADMIN_ROLES);
  await prisma.organization.update({ where: { id: orgId }, data: { isActive } });
  await writeAuditLog({
    userId: user.id,
    action: isActive ? "ORGANIZATION_REACTIVATED" : "ORGANIZATION_DEACTIVATED",
    entityType: "Organization",
    entityId: orgId,
  });
  revalidatePath("/admin/organizations");
  revalidatePath("/register");
}

export async function deleteOrganization(orgId: string): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser(SUPER_ADMIN_ROLES);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      _count: {
        select: {
          users: true,
          courses: true,
          quizzes: true,
          categories: true,
          questions: true,
          certificates: true,
          auditLogs: true,
          notifications: true,
        },
      },
    },
  });
  if (!org) return { error: "Organization not found" };

  const totalDependents = Object.values(org._count).reduce((a, b) => a + b, 0);
  if (totalDependents > 0) {
    return { error: "This organization has existing users or data — deactivate it instead of deleting." };
  }

  await prisma.organization.delete({ where: { id: orgId } });
  await writeAuditLog({ userId: user.id, action: "ORGANIZATION_DELETED", entityType: "Organization", entityId: orgId });
  revalidatePath("/admin/organizations");
  revalidatePath("/register");
  return { ok: true };
}
