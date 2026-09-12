import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { checkTotp } from "@/lib/auth/mfa";
import { afterEnroll, enrollmentMode } from "@/lib/auth/finish";
import { isUuid } from "@/lib/validation";

const input = z.object({
  id: z.string().refine(isUuid),
  code: z.string().min(1).max(16),
  next: z.string().max(512).optional(),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi({ allowPending: true });
  if (!auth.ok) return auth.response;

  const mode = await enrollmentMode(auth);
  if (!mode) return fail(403, "Nu poți adăuga o metodă nouă acum.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Scrie codul de 6 cifre din aplicație.");
  const userId = auth.user.id;

  const limit = await peek(rules.mfa, userId);
  if (limit.blocked) return tooMany(limit.retryAfter);

  if (!(await checkTotp(userId, parsed.data.code, parsed.data.id))) {
    await recordFailure(rules.mfa, userId);
    return fail(400, "Cod greșit. Verifică ora pe telefon și încearcă din nou.");
  }
  return json(await afterEnroll(auth, mode, clientInfo(req), "totp", parsed.data.next));
}
