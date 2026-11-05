export interface Env {
  FIGMA_CLIENT_ID?: string;
  FIGMA_CLIENT_SECRET?: string;
  AUTH_ENABLED?: string;
  AUTH_RATE_LIMITER?: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}

const EXTENSION_ID = "klifomaejfaibpkbigbpljdmelbkehbe";
const EXTENSION_ORIGIN = `chrome-extension://${EXTENSION_ID}`;
const REDIRECT_URI = `https://${EXTENSION_ID}.chromiumapp.org/`;
const MAX_REQUEST_BYTES = 4096;
const MAX_RESPONSE_BYTES = 32768;
const OAUTH_PATHS = new Set(["/oauth/exchange", "/oauth/refresh"]);

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function jsonResponse(
  status: number,
  body: unknown,
  origin: string | null,
  extraHeaders: Record<string, string> = {},
): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
    ...extraHeaders,
  });
  if (origin === EXTENSION_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function readObject(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Record<string, unknown>> {
  if (!stream) throw new HttpError(400, "invalid_request");
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      length += result.value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new HttpError(413, "body_too_large");
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const value: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("not_object");
    }
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

function isCredential(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 2048 &&
    /^[!-~]+$/u.test(value)
  );
}

function ready(env: Env): boolean {
  return Boolean(
    env.AUTH_ENABLED === "true" &&
      env.FIGMA_CLIENT_ID?.trim() &&
      env.FIGMA_CLIENT_SECRET?.trim() &&
      typeof env.AUTH_RATE_LIMITER?.limit === "function",
  );
}

function tokenPayload(
  value: Record<string, unknown>,
  exchange: boolean,
): Record<string, unknown> {
  if (
    !isCredential(value.access_token) ||
    typeof value.expires_in !== "number" ||
    !Number.isFinite(value.expires_in) ||
    value.expires_in <= 0 ||
    (exchange && !isCredential(value.refresh_token)) ||
    (value.refresh_token !== undefined && !isCredential(value.refresh_token)) ||
    (exchange &&
      !(
        (typeof value.user_id === "string" && value.user_id.length > 0) ||
        (typeof value.user_id === "number" &&
          Number.isSafeInteger(value.user_id))
      ))
  ) {
    throw new HttpError(502, "upstream_error");
  }
  const payload: Record<string, unknown> = {
    access_token: value.access_token,
    expires_in: value.expires_in,
  };
  if (value.refresh_token !== undefined)
    payload.refresh_token = value.refresh_token;
  if (exchange) payload.user_id = String(value.user_id);
  return payload;
}

export async function handleRequest(
  request: Request,
  env: Env,
  upstreamFetch: typeof fetch = fetch,
): Promise<Response> {
  const origin = request.headers.get("Origin");
  try {
    const url = new URL(request.url);
    if (url.search || (origin && origin !== EXTENSION_ORIGIN)) {
      throw new HttpError(403, "request_not_allowed");
    }
    if (url.pathname === "/health") {
      if (request.method !== "GET") {
        return jsonResponse(405, { error: "method_not_allowed" }, origin, {
          Allow: "GET",
        });
      }
      return jsonResponse(ready(env) ? 200 : 503, { ok: ready(env) }, origin);
    }
    if (!OAUTH_PATHS.has(url.pathname)) throw new HttpError(404, "not_found");
    if (request.method === "OPTIONS") {
      const requestedHeaders = request.headers
        .get("Access-Control-Request-Headers")
        ?.toLowerCase()
        .split(",")
        .map((header) => header.trim());
      if (
        origin !== EXTENSION_ORIGIN ||
        request.headers.get("Access-Control-Request-Method") !== "POST" ||
        requestedHeaders?.some((header) => header !== "content-type")
      ) {
        throw new HttpError(403, "request_not_allowed");
      }
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": EXTENSION_ORIGIN,
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-store",
          Vary: "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
        },
      });
    }
    if (request.method !== "POST") {
      return jsonResponse(405, { error: "method_not_allowed" }, origin, {
        Allow: "POST, OPTIONS",
      });
    }
    if (!ready(env)) throw new HttpError(503, "service_unavailable");
    const limiter = env.AUTH_RATE_LIMITER;
    if (!limiter) throw new HttpError(503, "service_unavailable");
    let allowed: boolean;
    try {
      const result = await limiter.limit({
        // Cloudflare supplies this header at the edge. Missing IPs share a bucket.
        key: `oauth:${request.headers.get("CF-Connecting-IP") || "unknown"}`,
      });
      allowed = result.success;
    } catch {
      throw new HttpError(503, "service_unavailable");
    }
    if (!allowed) {
      return jsonResponse(429, { error: "rate_limited" }, origin, {
        "Retry-After": "60",
      });
    }
    if (
      request.headers
        .get("Content-Type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() !== "application/json"
    ) {
      throw new HttpError(415, "unsupported_media_type");
    }
    if (Number(request.headers.get("Content-Length")) > MAX_REQUEST_BYTES) {
      throw new HttpError(413, "body_too_large");
    }
    const input = await readObject(request.body, MAX_REQUEST_BYTES);
    const exchange = url.pathname === "/oauth/exchange";
    const fields = exchange ? ["code", "redirect_uri"] : ["refresh_token"];
    if (Object.keys(input).some((key) => !fields.includes(key))) {
      throw new HttpError(400, "invalid_request");
    }
    if (
      (exchange &&
        (!isCredential(input.code) || input.redirect_uri !== REDIRECT_URI)) ||
      (!exchange && !isCredential(input.refresh_token))
    ) {
      throw new HttpError(400, "invalid_request");
    }
    const body = exchange
      ? new URLSearchParams({
          grant_type: "authorization_code",
          code: input.code as string,
          redirect_uri: REDIRECT_URI,
        })
      : new URLSearchParams({ refresh_token: input.refresh_token as string });
    let upstream: Response;
    try {
      upstream = await upstreamFetch(
        exchange
          ? "https://api.figma.com/v1/oauth/token"
          : "https://api.figma.com/v1/oauth/refresh",
        {
          method: "POST",
          // workerd supports follow/manual only. Reject every non-2xx below;
          // never forward OAuth credentials to a redirect destination.
          redirect: "manual",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${env.FIGMA_CLIENT_ID}:${env.FIGMA_CLIENT_SECRET}`)}`,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        },
      );
    } catch (error) {
      throw new HttpError(
        error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name)
          ? 504
          : 502,
        "upstream_unavailable",
      );
    }
    if (!upstream.ok) {
      await upstream.body?.cancel();
      if (upstream.status === 429) {
        const retryAfter = upstream.headers.get("Retry-After") ?? "";
        const seconds = /^\d{1,6}$/u.test(retryAfter)
          ? Math.max(1, Math.min(86400, Number(retryAfter)))
          : 60;
        return jsonResponse(429, { error: "upstream_rate_limited" }, origin, {
          "Retry-After": String(seconds),
        });
      }
      if ([400, 401, 403].includes(upstream.status)) {
        throw new HttpError(400, "invalid_grant");
      }
      throw new HttpError(502, "upstream_error");
    }
    let tokens: Record<string, unknown>;
    try {
      tokens = tokenPayload(
        await readObject(upstream.body, MAX_RESPONSE_BYTES),
        exchange,
      );
    } catch {
      throw new HttpError(502, "upstream_error");
    }
    return jsonResponse(200, tokens, origin);
  } catch (error) {
    // Never include input, upstream bodies, credentials, or exception text.
    return jsonResponse(
      error instanceof HttpError ? error.status : 500,
      { error: error instanceof HttpError ? error.code : "internal_error" },
      origin,
    );
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },
};
