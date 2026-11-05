import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

const redirect = "https://klifomaejfaibpkbigbpljdmelbkehbe.chromiumapp.org/";
const origin = "chrome-extension://klifomaejfaibpkbigbpljdmelbkehbe";

test("workerd exchanges and refreshes tokens without following upstream redirects", async () => {
  const calls = [];
  let upstreamStatus = 200;
  const tokens = {
    user_id: "test-user",
    access_token: "test-access",
    refresh_token: "test-refresh",
    expires_in: 3600,
  };
  const { user_id: _userId, ...refreshed } = tokens;
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      compatibilityDate: "2026-11-05",
      script: stripTypeScriptTypes(
        readFileSync(new URL("../src/index.ts", import.meta.url), "utf8"),
      ),
      bindings: {
        AUTH_ENABLED: "true",
        FIGMA_CLIENT_ID: "test-client",
        FIGMA_CLIENT_SECRET: "test-secret",
      },
      ratelimits: {
        AUTH_RATE_LIMITER: {
          namespace_id: "946582216",
          simple: { limit: 10, period: 60 },
        },
      },
      outboundService: async (request) => {
        calls.push({
          url: request.url,
          authorization: request.headers.get("Authorization"),
          body: Object.fromEntries(new URLSearchParams(await request.text())),
        });
        return upstreamStatus === 200
          ? Response.json(tokens)
          : new Response("test-secret", {
              status: upstreamStatus,
              headers: { Location: "https://unexpected.example/oauth" },
            });
      },
    }),
  );
  try {
    for (const status of [200, 302, 307]) {
      upstreamStatus = status;
      for (const path of ["exchange", "refresh"]) {
        const body =
          path === "exchange"
            ? { code: "test-code", redirect_uri: redirect }
            : { refresh_token: "test-refresh" };
        const count = calls.length;
        const response = await mf.dispatchFetch(
          `https://worker.example/oauth/${path}`,
          {
            method: "POST",
            headers: { Origin: origin, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        assert.equal(response.status, status === 200 ? 200 : 502);
        assert.equal(calls.length, count + 1);
        const call = calls.at(-1);
        assert.equal(
          call.url,
          `https://api.figma.com/v1/oauth/${path === "exchange" ? "token" : "refresh"}`,
        );
        assert.equal(
          call.authorization,
          `Basic ${btoa("test-client:test-secret")}`,
        );
        assert.deepEqual(
          call.body,
          path === "exchange"
            ? { grant_type: "authorization_code", ...body }
            : body,
        );
        assert.deepEqual(
          await response.json(),
          status === 200
            ? path === "exchange"
              ? tokens
              : refreshed
            : { error: "upstream_error" },
        );
      }
    }
  } finally {
    await mf.dispose();
  }
});
