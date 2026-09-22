"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function updateProfile(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const mobileNumber = String(formData.get("mobileNumber") ?? "").trim();
  const designation = String(formData.get("designation") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();

  if (fullName.length < 2) return { error: "Full name is required" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName,
      mobileNumber: mobileNumber || null,
      designation: designation || null,
      country: country || null,
    },
  });

  await writeAuditLog({ userId: user.id, organizationId: user.organizationId, action: "PROFILE_UPDATED", entityType: "User", entityId: user.id });
  revalidatePath("/profile");
  return { ok: true };
}

export async function changePassword(formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters" };

  const full = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const valid = await verifyPassword(currentPassword, full.passwordHash);
  if (!valid) return { error: "Current password is incorrect" };

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await writeAuditLog({ userId: user.id, organizationId: user.organizationId, action: "PASSWORD_CHANGED", entityType: "User", entityId: user.id });

  return { ok: true };
}
