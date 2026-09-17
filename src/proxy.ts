import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/security/cookie";
import { MAX_REQUEST_BYTES } from "@/features/photos/upload-limits";

// Only checks that a session cookie is present, so visitors go straight to the login page.
// The real check against the database runs in every page and route (features/staff/dal.ts).
export function proxy(req: NextRequest) {
  // Oversized submissions are turned away here, before the request reaches the server
  // function at all, instead of only after it has already been received and read.
  if (req.nextUrl.pathname === "/api/reports" && req.method === "POST") {
    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "poza e prea mare" }, { status: 413 });
    }
    return NextResponse.next();
  }

  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/login", req.url);
  login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/account/:path*", "/api/reports"],
};
