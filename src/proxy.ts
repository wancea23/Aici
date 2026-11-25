import { NextResponse, type NextRequest } from "next/server";
import { CITIZEN_COOKIE, SESSION_COOKIE } from "@/server/security/cookie";
import { MAX_REQUEST_BYTES } from "@/features/photos/upload-limits";
import { buildCsp, newNonce } from "@/server/security/csp";

// The staff area. Without a session cookie these go straight to the login page.
// Only checks that a session cookie is present: the real check against the database runs in
// every page and route (features/staff/dal.ts).
function isStaffOnly(pathname: string) {
  return (
    /^\/(dashboard|admin|account|reports)(\/|$)/.test(pathname) || pathname === "/api/reports"
  );
}

// The citizen's own page. Same idea, with the citizen cookie and the citizen sign in page.
function isCitizenOnly(pathname: string) {
  return pathname === "/profile";
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Oversized submissions are turned away here, before the request reaches the server
  // function at all, instead of only after it has already been received and read.
  if (pathname === "/api/reports" && req.method === "POST") {
    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "poza e prea mare" }, { status: 413 });
    }
    return NextResponse.next();
  }

  if (isStaffOnly(pathname) && !req.cookies.has(SESSION_COOKIE)) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (isCitizenOnly(pathname) && !req.cookies.has(CITIZEN_COOKIE)) {
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  // Every other response gets the Content-Security-Policy with a fresh nonce (see csp.ts).
  // Next.js reads the policy from the request headers to put the nonce on its own scripts.
  const nonce = newNonce();
  const csp = buildCsp(nonce);
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  // Everything except Next's own build files, which never render HTML.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
