import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { hashPassword, validateNewPassword } from "@/lib/auth/password";
import { findStaffById, findToken, redeemReset } from "@/lib/auth/staff";
import { audit } from "@/lib/auth/audit";

export const runtime = "nodejs";

const input = z.object({
  token: z.string().max(128),
  password: z.string().min(1).max(1024),
});

const EXPIRED = "Linkul nu mai este valabil. Cere unul nou administratorului.";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Alege o parolă.");
  const client = clientInfo(req);
  const ipKey = client.ip ?? "unknown";

  const limit = await peek(rules.tokenIp, ipKey);
  if (limit.blocked) return tooMany(limit.retryAfter);

  const link = await findToken(parsed.data.token, "password_reset");
  const user = link?.user_id ? await findStaffById(link.user_id) : null;
  if (!link || !user || !user.is_active) {
    await recordFailure(rules.tokenIp, ipKey);
    return fail(400, EXPIRED);
  }

  const problem = await validateNewPassword(parsed.data.password, user.email);
  if (problem) return fail(400, problem);

  if (!(await redeemReset(link.id, user.id, await hashPassword(parsed.data.password)))) {
    return fail(400, EXPIRED);
  }

  await audit({
    actorId: user.id,
    action: "auth.password.reset",
    status: "success",
    targetType: "staff_user",
    targetId: user.id,
    client,
  });
  return json({ next: "/login" });
}
