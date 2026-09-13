import "server-only";
import { notFound, redirect } from "next/navigation";
import { currentSession, type Role, type SessionResult } from "@/lib/auth/session";
import { fail } from "@/lib/auth/http";

type Options = {
  role?: Role;
  // the password page must stay reachable while a reset is forced
  allowPasswordReset?: boolean;
};

export function hasRole(actual: Role, needed: Role) {
  return needed === "operator" || actual === "admin";
}

// Every protected page starts here. The proxy only checks that a cookie exists,
// the real check against the database happens in this function.
export async function requireStaffPage(path: string, opts: Options = {}): Promise<SessionResult> {
  const result = await currentSession();

  if (!result) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (result.user.forcePasswordReset && !opts.allowPasswordReset) redirect("/cont/parola");
  // A page the role can't use looks like a page that doesn't exist.
  if (opts.role && !hasRole(result.user.role, opts.role)) notFound();

  return result;
}

type ApiResult = ({ ok: true } & SessionResult) | { ok: false; response: Response };

// Same checks for route handlers, answered with 401 or 403 instead of a redirect.
export async function requireStaffApi(opts: Options = {}): Promise<ApiResult> {
  const result = await currentSession();

  if (!result) {
    return { ok: false, response: fail(401, "Sesiunea a expirat. Autentifică-te din nou.") };
  }
  if (result.user.forcePasswordReset && !opts.allowPasswordReset) {
    return { ok: false, response: fail(403, "Schimbă parola înainte de a continua.") };
  }
  if (opts.role && !hasRole(result.user.role, opts.role)) {
    return { ok: false, response: fail(403, "Nu ai acces la această acțiune.") };
  }
  return { ok: true, ...result };
}
