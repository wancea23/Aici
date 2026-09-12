import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { fail, json, tooMany } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { peek, rules } from "@/lib/auth/rate-limit";
import { authenticationOptions, registrationOptions } from "@/lib/auth/webauthn";
import { enrollmentMode } from "@/lib/auth/finish";

const input = z.object({ purpose: z.enum(["login", "register"]) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi({ allowPending: true });
  if (!auth.ok) return auth.response;

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Cerere invalidă.");

  if (parsed.data.purpose === "login") {
    if (auth.session.mfaVerified) return fail(400, "Ești deja autentificat.");
    const limit = await peek(rules.mfa, auth.user.id);
    if (limit.blocked) return tooMany(limit.retryAfter);

    const options = await authenticationOptions(auth.session.id, auth.user.id);
    if (!options) return fail(400, "Contul nu are nicio cheie de acces.");
    return json(options);
  }

  if (!(await enrollmentMode(auth))) return fail(403, "Nu poți adăuga o metodă nouă acum.");
  return json(await registrationOptions(auth.session.id, auth.user));
}
