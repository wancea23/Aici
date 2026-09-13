import { sameOrigin } from "@/lib/auth/csrf";
import { fail, json } from "@/lib/auth/http";
import { endCitizenSession } from "@/lib/auth/citizen-session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");
  await endCitizenSession();
  return json({ next: "/" });
}
