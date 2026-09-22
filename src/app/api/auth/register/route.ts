import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { ipAddress, userAgent } = requestMeta(req);

  const limited = rateLimit(`register:${ipAddress ?? "unknown"}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  const organization = await prisma.organization.findFirst({
    where: { id: data.organizationId, isActive: true },
  });
  if (!organization) {
    return NextResponse.json({ error: "Selected organization is not available" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      mobileNumber: data.mobileNumber || undefined,
      designation: data.designation || undefined,
      country: data.country || undefined,
      role: "PARTICIPANT",
      termsAcceptedAt: new Date(),
      // Demo/dev posture: auto-verify so the golden path works without an
      // email provider wired up. A production deployment should require
      // verify-email (the endpoint and token flow already exist) before login.
      emailVerifiedAt: new Date(),
    },
  });

  const token = await createSession({
    userId: user.id,
    role: user.role,
    userAgent,
    ipAddress,
  });
  await setSessionCookie(token);

  await writeAuditLog({
    organizationId: organization.id,
    userId: user.id,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  });
}
