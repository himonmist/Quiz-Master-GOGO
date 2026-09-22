import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeToken, revokeSession, clearSessionCookie } from "@/lib/auth";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function POST(req: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    const payload = await decodeToken(token);
    if (payload) {
      await revokeSession(payload.sid);
      const { ipAddress, userAgent } = requestMeta(req);
      await writeAuditLog({
        userId: payload.sub,
        action: "USER_LOGOUT",
        entityType: "User",
        entityId: payload.sub,
        ipAddress,
        userAgent,
      });
    }
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
