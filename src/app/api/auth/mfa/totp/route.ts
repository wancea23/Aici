import QRCode from "qrcode";
import { sameOrigin } from "@/lib/auth/csrf";
import { fail, json } from "@/lib/auth/http";
import { requireStaffApi } from "@/lib/auth/dal";
import { hasVerifiedTotp, startTotpSetup } from "@/lib/auth/mfa";
import { groupedKey, totpUri } from "@/lib/auth/totp";
import { enrollmentMode } from "@/lib/auth/finish";

// Starts TOTP setup: the QR code and the key are shown once and only count after a correct code.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "Cerere respinsă.");

  const auth = await requireStaffApi({ allowPending: true });
  if (!auth.ok) return auth.response;
  if (!(await enrollmentMode(auth))) return fail(403, "Nu poți adăuga o metodă nouă acum.");
  if (await hasVerifiedTotp(auth.user.id)) {
    return fail(409, "Ai deja o aplicație de autentificare. Șterge-o întâi din pagina contului.");
  }

  const { id, secret } = await startTotpSetup(auth.user.id);
  const qr = await QRCode.toDataURL(totpUri(auth.user.email, secret), { margin: 1, width: 220 });
  return json({ id, qr, key: groupedKey(secret) });
}
