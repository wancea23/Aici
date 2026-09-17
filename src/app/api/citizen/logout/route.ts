import { sameOrigin } from "@/server/security/csrf";
import { fail, json } from "@/server/http/responses";
import { endCitizenSession } from "@/features/citizens/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");
  await endCitizenSession();
  return json({ next: "/" });
}
