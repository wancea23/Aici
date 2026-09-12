import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json, tooMany } from "@/lib/auth/http";
import { peek, recordFailure, rules } from "@/lib/auth/rate-limit";
import { hashPassword, validateNewPassword } from "@/lib/auth/password";
import { acceptInvite, findToken } from "@/lib/auth/staff";
import { audit } from "@/lib/auth/audit";

export const runtime = "nodejs";

const input = z.object({
  token: z.string().max(128),
  password: z.string().min(1).max(1024),
});

const EXPIRED = "Invitația nu mai este valabilă. Cere una nouă administratorului.";

// The invited person picks a password. MFA is set up at the first login right after.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Alege o parolă.");
  const client = clientInfo(req);
  const ipKey = client.ip ?? "unknown";

  const limit = await peek(rules.tokenIp, ipKey);
  if (limit.blocked) return tooMany(limit.retryAfter);

  const invite = await findToken(parsed.data.token, "invite");
  if (!invite || !invite.role) {
    await recordFailure(rules.tokenIp, ipKey);
    return fail(400, EXPIRED);
  }

  const problem = await validateNewPassword(parsed.data.password, invite.email);
  if (problem) return fail(400, problem);

  const result = await acceptInvite(invite.id, invite.email, invite.role, await hashPassword(parsed.data.password));
  if (result === "used") return fail(400, EXPIRED);
  if (result === "exists") return fail(409, "Există deja un cont cu acest email. Autentifică-te.");

  await audit({
    actorId: result.id,
    action: "staff.invite_accepted",
    status: "success",
    targetType: "staff_user",
    targetId: result.id,
    client,
    details: { role: invite.role },
  });
  return json({ next: "/login" });
}
