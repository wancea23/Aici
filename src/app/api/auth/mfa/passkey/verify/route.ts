import { z } from "zod";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { verifyAuthentication, verifyRegistration } from "@/lib/auth/webauthn";
import { afterEnroll, enrollmentMode, finishMfa } from "@/lib/auth/finish";
import { audit } from "@/lib/auth/audit";

// The library checks the full structure, this only keeps obvious junk out.
const input = z.object({
  purpose: z.enum(["login", "register"]),
  response: z.object({ id: z.string().min(1).max(1024) }).passthrough(),
  label: z.string().trim().max(60).optional(),
  next: z.string().max(512).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi({ allowPending: true });
  if (!auth.ok) return auth.response;

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Cerere invalidă.");
  const { purpose, next } = parsed.data;
  const client = clientInfo(req);
  const userId = auth.user.id;

  if (purpose === "login") {
    if (auth.session.mfaVerified) return fail(400, "Ești deja autentificat.");
    const limit = await peek(rules.mfa, userId);
    if (limit.blocked) return tooMany(limit.retryAfter);

    const response = parsed.data.response as unknown as AuthenticationResponseJSON;
    if (!(await verifyAuthentication(auth.session.id, userId, response))) {
      await recordFailure(rules.mfa, userId);
      await audit({ actorId: userId, action: "auth.login.mfa", status: "failure", client, details: { method: "passkey" } });
      return fail(401, "Cheia de acces nu a putut fi verificată.");
    }
    return json({ next: await finishMfa(auth, client, "passkey", next) });
  }

  const mode = await enrollmentMode(auth);
  if (!mode) return fail(403, "Nu poți adăuga o metodă nouă acum.");

  const response = parsed.data.response as unknown as RegistrationResponseJSON;
  const label = parsed.data.label || "Cheie de acces";
  if (!(await verifyRegistration(auth.session.id, userId, response, label))) {
    return fail(400, "Cheia de acces nu a putut fi înregistrată. Încearcă din nou.");
  }
  return json(await afterEnroll(auth, mode, client, "webauthn", next));
}
