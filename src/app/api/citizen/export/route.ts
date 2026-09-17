import { auditCitizen } from "@/features/citizens/accounts";
import { exportCitizenData } from "@/features/citizens/personal-data";
import { currentCitizen } from "@/features/citizens/session";
import { fail, tooMany } from "@/server/http/responses";
import { countAttempt, peek, rules } from "@/server/security/rate-limit";

export const runtime = "nodejs";

// A plain link, so it works without JavaScript. Another site could send someone here, but
// the answer is a download it can never read, and the file only ever holds the data of the
// account whose session cookie came with the request.
export async function GET() {
  const citizen = await currentCitizen();
  if (!citizen) return fail(401, "Autentifică-te ca să descarci datele.");

  const limit = await peek(rules.citizenExport, citizen.id);
  if (limit.blocked) return tooMany(limit.retryAfter);
  await countAttempt(rules.citizenExport, citizen.id);

  const data = await exportCitizenData(citizen.id);
  await auditCitizen("citizen.data_export", "success", citizen.id);

  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="aici-my-data-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
