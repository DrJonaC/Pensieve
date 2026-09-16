export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    // Next's internal request URL may use localhost when the browser uses 127.0.0.1.
    return parsed.host === (request.headers.get("host") ?? new URL(request.url).host) &&
      parsed.protocol === new URL(request.url).protocol;
  } catch { return false; }
}
