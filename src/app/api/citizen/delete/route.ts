import { z } from "zod";
import { auditCitizen, findCitizenById } from "@/features/citizens/accounts";
import { CONFIRM_WORD, confirmMatches } from "@/features/citizens/confirm-word";
import { deleteCitizenAccount } from "@/features/citizens/personal-data";
import { currentCitizen, endCitizenSession } from "@/features/citizens/session";
import { fail, json, tooMany } from "@/server/http/responses";
import { sameOrigin } from "@/server/security/csrf";
import { verifyPassword } from "@/server/security/password";
import { peek, recordFailure, rules } from "@/server/security/rate-limit";

export const runtime = "nodejs";

const input = z.object({
  password: z.string().min(1).max(1024),
  confirm: z.string().max(64),
});

// Deleting is permanent, so it asks for the password again even though the session is
// already valid: a borrowed browser or a stolen cookie is not enough on its own.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const citizen = await currentCitizen();
  if (!citizen) return fail(401, "Autentifică-te din nou.");

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Scrie parola și cuvântul de confirmare.");
  if (!confirmMatches(parsed.data.confirm)) return fail(400, `Scrie ${CONFIRM_WORD} ca să confirmi.`);

  const limit = await peek(rules.citizenDelete, citizen.id);
  if (limit.blocked) return tooMany(limit.retryAfter);

  const account = await findCitizenById(citizen.id);
  if (!account || !(await verifyPassword(account.password_hash, parsed.data.password))) {
    await recordFailure(rules.citizenDelete, citizen.id);
    await auditCitizen("citizen.account_delete", "failure", citizen.id, { reason: "wrong_password" });
    return fail(401, "Parola nu este corectă.");
  }

  await deleteCitizenAccount(citizen.id, citizen.email);
  // The account is gone from the log's point of view too, only the id stays.
  await auditCitizen("citizen.account_delete", "success", citizen.id);
  await endCitizenSession();

  return json({ done: true });
}
