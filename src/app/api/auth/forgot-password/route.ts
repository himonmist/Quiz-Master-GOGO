import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateRawToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/audit";
import crypto from "crypto";

export async function POST(req: Request) {
  const { ipAddress } = requestMeta(req);
  const limited = rateLimit(`forgot:${ipAddress ?? "unknown"}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always respond 200 regardless of whether the account exists, so the
  // endpoint can't be used to enumerate registered emails.
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const rawToken = generateRawToken();
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      type: "PASSWORD_RESET",
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      organizationId: user.organizationId,
      type: "PASSWORD_RESET",
      title: "Reset your Quiz Master GOGO password",
      body: `Use this link within 30 minutes: /reset-password?token=${rawToken}`,
      channel: "EMAIL",
      status: "PENDING", // no SMTP/email provider wired up in this build — see README
    },
  });

  const devPayload = process.env.NODE_ENV !== "production" ? { resetLink: `/reset-password?token=${rawToken}` } : {};
  return NextResponse.json({ ok: true, ...devPayload });
}
