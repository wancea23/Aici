// Every state changing request must come from our own pages. Browsers send Origin
// on POST, PATCH and DELETE, and a page on another site can't fake it.
export function sameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
