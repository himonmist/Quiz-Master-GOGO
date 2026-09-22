import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { ipAddress, userAgent } = requestMeta(req);

  const limited = rateLimit(`login:${ipAddress ?? "unknown"}`, 15, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }
  const { email, password, rememberMe } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-shape response whether or not the account exists, to avoid
  // leaking which emails are registered.
  const valid = user && !user.deletedAt ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    await writeAuditLog({
      userId: user?.id,
      organizationId: user?.organizationId,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user?.id,
      ipAddress,
      userAgent,
      metadata: { email },
    });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json({ error: "This account has been suspended" }, { status: 403 });
  }

  const token = await createSession({
    userId: user.id,
    role: user.role,
    rememberMe,
    userAgent,
    ipAddress,
  });
  await setSessionCookie(token, rememberMe);

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  await writeAuditLog({
    userId: user.id,
    organizationId: user.organizationId,
    action: "USER_LOGIN",
    entityType: "User",
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  });
}
