export type ApiData = {
  error?: string;
  next?: string;
  challenge?: boolean;
  link?: string;
  [key: string]: unknown;
};

export type ApiResult = { ok: boolean; status: number; data: ApiData };

export async function sendJson(url: string, body?: unknown, method = "POST"): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as ApiData;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Nu am putut contacta serverul. Verifică conexiunea." } };
  }
}
