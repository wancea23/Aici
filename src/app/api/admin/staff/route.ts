import { z } from "zod";
import { sameOrigin } from "@/lib/auth/csrf";
import { clientInfo } from "@/lib/auth/request";
import { fail, json } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { createInvite, findStaffByEmail, linkFor } from "@/lib/auth/staff";
import { audit } from "@/lib/auth/audit";

const input = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["operator", "admin"]),
});

// There is no email service yet, so the admin gets the link and passes it on.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi({ role: "admin" });
  if (!auth.ok) return auth.response;

  const parsed = input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "Scrie un email valid și alege rolul.");
  const { email, role } = parsed.data;

  if (await findStaffByEmail(email)) return fail(409, "Există deja un cont cu acest email.");

  const token = await createInvite(email, role, auth.user.id);
  await audit({
    actorId: auth.user.id,
    action: "staff.invited",
    status: "success",
    targetType: "invite",
    client: clientInfo(req),
    details: { email, role },
  });
  return json({ link: linkFor(req, "/invitatie", token) });
}
