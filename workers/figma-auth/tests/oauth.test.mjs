import assert from "node:assert/strict";
import test from "node:test";
import worker, { handleRequest } from "../src/index.ts";

const origin = "chrome-extension://klifomaejfaibpkbigbpljdmelbkehbe";
const redirect = "https://klifomaejfaibpkbigbpljdmelbkehbe.chromiumapp.org/";
const fakeSecret = "test-only-secret-never-use-in-production";
const tokens = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  user_id: "test-user",
};
const env = (overrides = {}) => ({
  AUTH_ENABLED: "true",
  FIGMA_CLIENT_ID: "test-client",
  FIGMA_CLIENT_SECRET: fakeSecret,
  AUTH_RATE_LIMITER: { limit: async () => ({ success: true }) },
  ...overrides,
});
const request = (path = "/oauth/exchange", body, options = {}) =>
  new Request(`https://worker.example${path}`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body ?? { code: "test-code", redirect_uri: redirect }),
    ...options,
  });
const neverFetch = async () => {
  assert.fail("The upstream must not be called");
};

test("code exchange uses fixed upstream, secret only in Basic auth, and filtered response", async () => {
  let calls = 0;
  const response = await handleRequest(request(), env(), async (url, init) => {
    calls++;
    assert.equal(url, "https://api.figma.com/v1/oauth/token");
    assert.equal(init.method, "POST");
    assert.equal(init.redirect, "error");
    assert.equal(
      init.headers.Authorization,
      `Basic ${btoa(`test-client:${fakeSecret}`)}`,
    );
    assert.deepEqual(Object.fromEntries(init.body), {
      grant_type: "authorization_code",
      code: "test-code",
      redirect_uri: redirect,
    });
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json({
      ...tokens,
      client_secret: fakeSecret,
      unexpected: "drop",
    });
  });
  assert.equal(calls, 1);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), tokens);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("production handler ignores the runtime ExecutionContext as a fetch dependency", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(tokens);
  try {
    const response = await worker.fetch(request(), env(), { waitUntil() {} });
    assert.equal(response.status, 200);
  } finally {
    globalThis.fetch = original;
  }
});

test("refresh supports rotated tokens and responses without a replacement refresh token", async () => {
  for (const rotated of [true, false]) {
    const response = await handleRequest(
      request("/oauth/refresh", { refresh_token: "old-refresh" }),
      env(),
      async (url, init) => {
        assert.equal(url, "https://api.figma.com/v1/oauth/refresh");
        assert.deepEqual(Object.fromEntries(init.body), {
          refresh_token: "old-refresh",
        });
        return Response.json({
          access_token: "new-access",
          expires_in: 3600,
          ...(rotated ? { refresh_token: "new-refresh" } : {}),
        });
      },
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.access_token, "new-access");
    assert.equal(body.refresh_token, rotated ? "new-refresh" : undefined);
  }
});

test("unconfigured, disabled, or unavailable rate limiter stops OAuth before upstream", async () => {
  for (const overrides of [
    { AUTH_ENABLED: undefined },
    { AUTH_ENABLED: "false" },
    { FIGMA_CLIENT_ID: "" },
    { FIGMA_CLIENT_SECRET: undefined },
    { AUTH_RATE_LIMITER: undefined },
    {
      AUTH_RATE_LIMITER: {
        limit: async () => {
          throw new Error(fakeSecret);
        },
      },
    },
  ]) {
    const response = await handleRequest(request(), env(overrides), neverFetch);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "service_unavailable" });
  }
});

test("health checks readiness without calling Figma or spending rate-limit quota", async () => {
  for (const enabled of [true, false]) {
    const response = await handleRequest(
      new Request("https://worker.example/health"),
      env({
        AUTH_ENABLED: String(enabled),
        AUTH_RATE_LIMITER: { limit: neverFetch },
      }),
      neverFetch,
    );
    assert.equal(response.status, enabled ? 200 : 503);
    assert.deepEqual(await response.json(), { ok: enabled });
  }
});

test("CORS permits only the production extension and narrowly validates preflight", async () => {
  const preflight = (extra = {}) =>
    new Request("https://worker.example/oauth/exchange", {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
        ...extra,
      },
    });
  const valid = await handleRequest(preflight(), env(), neverFetch);
  assert.equal(valid.status, 204);
  assert.equal(valid.headers.get("Access-Control-Allow-Origin"), origin);
  for (const headers of [
    { Origin: "https://evil.example" },
    { "Access-Control-Request-Method": "DELETE" },
    { "Access-Control-Request-Headers": "authorization" },
  ]) {
    const response = await handleRequest(preflight(headers), env(), neverFetch);
    assert.equal(response.status, 403);
    assert.notEqual(
      response.headers.get("Access-Control-Allow-Origin"),
      "https://evil.example",
    );
  }
  const blocked = await handleRequest(
    request(undefined, undefined, {
      headers: {
        Origin: "https://evil.example",
        "Content-Type": "application/json",
      },
    }),
    env(),
    neverFetch,
  );
  assert.equal(blocked.status, 403);
});

test("requests without Origin still require a valid grant and upstream validation", async () => {
  const response = await handleRequest(
    request(undefined, undefined, {
      headers: { "Content-Type": "application/json" },
    }),
    env(),
    async () => new Response(fakeSecret, { status: 401 }),
  );
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  assert.deepEqual(await response.json(), { error: "invalid_grant" });
});

test("rate limit keys use edge-supplied IP and rejection never reaches Figma", async () => {
  let key;
  const response = await handleRequest(
    request(undefined, undefined, {
      headers: {
        "Content-Type": "application/json",
        "CF-Connecting-IP": "192.0.2.1",
      },
    }),
    env({
      AUTH_RATE_LIMITER: {
        limit: async (options) => {
          key = options.key;
          return { success: false };
        },
      },
    }),
    neverFetch,
  );
  assert.equal(key, "oauth:192.0.2.1");
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
});

test("invalid bodies, foreign redirect, extra fields and arbitrary routes are refused", async () => {
  for (const body of [
    { code: "", redirect_uri: redirect },
    { code: "valid", redirect_uri: "https://evil.example/" },
    { code: "valid", redirect_uri: `${redirect}different` },
    { code: "valid", redirect_uri: redirect, url: "https://evil.example/" },
    { code: "valid", redirect_uri: redirect, client_id: "foreign-client" },
    { code: "with whitespace", redirect_uri: redirect },
    { code: "valid" },
    [],
    null,
  ]) {
    const response = await handleRequest(
      request(undefined, undefined, {
        body: JSON.stringify(body),
      }),
      env(),
      neverFetch,
    );
    assert.equal(response.status, 400);
  }
  for (const body of [{}, { refresh_token: "" }, { refresh_token: 12 }]) {
    const response = await handleRequest(
      request("/oauth/refresh", body),
      env(),
      neverFetch,
    );
    assert.equal(response.status, 400);
  }
  assert.equal(
    (await handleRequest(request("/proxy"), env(), neverFetch)).status,
    404,
  );
  assert.equal(
    (
      await handleRequest(
        request("/oauth/exchange?code=secret"),
        env(),
        neverFetch,
      )
    ).status,
    403,
  );
  const get = await handleRequest(
    new Request("https://worker.example/oauth/exchange"),
    env(),
    neverFetch,
  );
  assert.equal(get.status, 405);
  assert.equal(get.headers.get("Allow"), "POST, OPTIONS");
});

test("non-JSON, malformed JSON, and oversized buffered or streamed bodies fail safely", async () => {
  for (const [options, status] of [
    [{ headers: { "Content-Type": "text/plain" } }, 415],
    [{ body: "{" }, 400],
    [
      {
        body: JSON.stringify({
          code: "x".repeat(5000),
          redirect_uri: redirect,
        }),
      },
      413,
    ],
    [
      {
        body: "{}",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "5000",
        },
      },
      413,
    ],
    [
      {
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(5000));
            controller.close();
          },
        }),
        duplex: "half",
      },
      413,
    ],
  ]) {
    const response = await handleRequest(
      request(undefined, undefined, options),
      env(),
      neverFetch,
    );
    assert.equal(response.status, status);
  }
});

test("upstream failures are sanitized, including rate limits, timeouts and exception text", async () => {
  for (const [upstreamStatus, expected] of [
    [400, 400],
    [401, 400],
    [403, 400],
    [429, 429],
    [500, 502],
    [302, 502],
  ]) {
    const response = await handleRequest(
      request(),
      env(),
      async () => new Response(fakeSecret, { status: upstreamStatus }),
    );
    assert.equal(response.status, expected);
    assert.ok(!(await response.text()).includes(fakeSecret));
  }
  for (const [name, status] of [
    ["Error", 502],
    ["TimeoutError", 504],
    ["AbortError", 504],
  ]) {
    const response = await handleRequest(request(), env(), async () => {
      const error = new Error(fakeSecret);
      error.name = name;
      throw error;
    });
    assert.equal(response.status, status);
    assert.ok(!(await response.text()).includes(fakeSecret));
  }
});

test("invalid, oversized or incomplete upstream responses never become successful tokens", async () => {
  for (const upstream of [
    () => new Response("not JSON"),
    () => new Response("x".repeat(33000)),
    () => Response.json({ ...tokens, expires_in: -1 }),
    () => Response.json({ ...tokens, refresh_token: undefined }),
    () => Response.json({ ...tokens, access_token: "" }),
    () => Response.json({ ...tokens, user_id: undefined }),
  ]) {
    const response = await handleRequest(request(), env(), async () =>
      upstream(),
    );
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: "upstream_error" });
  }
});

test("upstream Retry-After is respected as a bounded number and never reflects secrets", async () => {
  for (const [header, expected] of [
    ["600", "600"],
    ["999999", "86400"],
    [fakeSecret, "60"],
  ]) {
    const response = await handleRequest(
      request(),
      env(),
      async () =>
        new Response(null, { status: 429, headers: { "Retry-After": header } }),
    );
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), expected);
  }
});
