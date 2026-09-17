export type ClientInfo = { ip: string | null; userAgent: string | null };

// Behind Caddy the real address is the first x-forwarded-for entry. Used only for
// throttling and the audit log, never to grant anything.
export function clientInfo(req: Request): ClientInfo {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent");
  return { ip: ip ? ip.slice(0, 64) : null, userAgent: userAgent ? userAgent.slice(0, 256) : null };
}
