import "server-only";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import type { Role, User } from "@prisma/client";
import { SESSION_COOKIE } from "./constants";

export { SESSION_COOKIE };
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}
const JWT_SECRET: string = process.env.JWT_SECRET;

const SHORT_SESSION_MS = 1000 * 60 * 60 * 24; // 1 day
const REMEMBER_ME_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type SafeUser = Omit<User, "passwordHash">;

interface JwtPayload {
  sub: string; // userId
  sid: string; // session row id
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(params: {
  userId: string;
  role: Role;
  rememberMe?: boolean;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<string> {
  const ttl = params.rememberMe ? REMEMBER_ME_MS : SHORT_SESSION_MS;
  const expiresAt = new Date(Date.now() + ttl);

  // The session row is what makes the token revocable (logout, suspend
  // user, admin force-logout); the JWT alone is only a fast-path cache.
  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      tokenHash: "", // filled in below once we know the session id
      userAgent: params.userAgent ?? undefined,
      ipAddress: params.ipAddress ?? undefined,
      rememberMe: Boolean(params.rememberMe),
      expiresAt,
    },
  });

  const token = jwt.sign({ sub: params.userId, sid: session.id, role: params.role } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: Math.floor(ttl / 1000),
  });

  await prisma.session.update({
    where: { id: session.id },
    data: { tokenHash: hashToken(token) },
  });

  return token;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  }).catch(() => undefined);
}

export async function setSessionCookie(token: string, rememberMe?: boolean) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: rememberMe ? REMEMBER_ME_MS / 1000 : SHORT_SESSION_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function decodeToken(token: string): Promise<JwtPayload | null> {
  return verifyToken(token);
}

async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/** Server-only: resolves the current request's user from the session cookie. */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return resolveUserFromToken(token);
}

/** Same resolution logic, usable from a Route Handler given a raw cookie value. */
export async function resolveUserFromToken(token: string): Promise<SafeUser | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({ where: { id: payload.sid } });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.tokenHash !== hashToken(token)) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive || user.deletedAt) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _omit, ...safe } = user;
  return safe;
}

export function assertRole(user: SafeUser | null, allowed: Role[]): user is SafeUser {
  return !!user && allowed.includes(user.role);
}

export const SUPER_ADMIN_ROLES: Role[] = ["SUPER_ADMIN"];
export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ORG_ADMIN"];
export const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "ORG_ADMIN", "QUIZ_MANAGER"];

/** Server Component / layout guard: redirects rather than returning null. */
export async function requireUser(allowedRoles?: Role[]): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) redirect("/dashboard");
  return user;
}
