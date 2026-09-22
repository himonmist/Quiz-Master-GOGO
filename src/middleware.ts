import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

// Coarse, Edge-safe gate: redirect unauthenticated requests away from
// protected areas. This only checks cookie presence (no DB/JWT verify —
// jsonwebtoken needs the Node runtime), so it's a UX fast-path, not the
// authorization boundary. Every protected layout re-checks with
// getCurrentUser() (Node runtime, full session + role validation) before
// rendering anything or accepting a mutation.
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/quiz", "/courses", "/certificates", "/profile", "/history"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const hasCookie = req.cookies.has(SESSION_COOKIE);
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/quiz/:path*", "/courses/:path*", "/certificates/:path*", "/profile/:path*", "/history/:path*"],
};
