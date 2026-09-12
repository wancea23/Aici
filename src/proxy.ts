import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

// Only checks that a session cookie is present, so visitors go straight to the login page.
// The real check against the database runs in every page and route (lib/auth/dal.ts).
export function proxy(req: NextRequest) {
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/panou/:path*", "/admin/:path*", "/cont/:path*"],
};
