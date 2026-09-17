import { json } from "@/server/http/responses";
import { newChallenge } from "@/server/security/altcha";

export async function GET() {
  return json(await newChallenge());
}
