import { json } from "@/lib/auth/http";
import { newChallenge } from "@/lib/auth/altcha";

export async function GET() {
  return json(await newChallenge());
}
