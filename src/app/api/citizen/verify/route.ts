import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { auditCitizen, completeSignup, findSignup } from "@/lib/auth/citizen";

export const runtime = "nodejs";

const input = z.object({ token: z.string().max(128) });

const EXPIRED = "Linkul nu mai este valabil sau a fost deja folosit.";

// Opening the link from the email is enough. The account keeps the password chosen at
// sign up, and the person signs in with it afterwards.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, EXPIRED);
  const ipKey = clientInfo(req).ip ?? "unknown";

  const limit = await peek(rules.tokenIp, ipKey);
  if (limit.blocked) return tooMany(limit.retryAfter);

  const signup = await findSignup(parsed.data.token);
  if (!signup) {
    await recordFailure(rules.tokenIp, ipKey);
    return fail(400, EXPIRED);
  }

  const result = await completeSignup(signup);
  if (result === "used") return fail(400, EXPIRED);
  if (result === "exists") return fail(409, "Adresa aceasta are deja un cont confirmat.");

  await auditCitizen("citizen.email_verified", "success", result.id);
  return json({ verified: true });
}
