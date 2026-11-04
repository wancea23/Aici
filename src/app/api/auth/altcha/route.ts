import { json } from "@/server/http/responses";
import { newChallenge } from "@/server/security/altcha";
import { safeRoute } from "@/server/http/safe-route";

async function handleGet() {
  return json(await newChallenge());
}

export const GET = safeRoute(handleGet);
