import { mutateAccounts } from "@/lib/account-storage";
import { getAuthBaseUrl } from "@/lib/auth-config";
import i18n from "@/lib/i18n.svelte";
import { clearProjectSnapshot } from "@/lib/project-storage";
import { applyAccounts, store } from "@/lib/store.svelte";
import type { Accounts, AuthTokens } from "@/types";

const clientId = import.meta.env.WXT_FIGMA_ID;
const authBaseUrl = getAuthBaseUrl(import.meta.env.WXT_AUTH_BASE_URL);

export default { logIn, logOut, refreshTokens };

async function authRequest(path: string, body: Record<string, string>) {
  return fetch(`${authBaseUrl}${path}`, {
    method: "POST",
    credentials: "omit",
    cache: "no-store",
    redirect: "error",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
}

function readTokens(
  data: Record<string, unknown>,
  previousRefresh = "",
): AuthTokens {
  if (
    typeof data.access_token !== "string" ||
    !data.access_token ||
    typeof data.expires_in !== "number" ||
    !Number.isFinite(data.expires_in) ||
    data.expires_in <= 0 ||
    (data.refresh_token !== undefined &&
      (typeof data.refresh_token !== "string" || !data.refresh_token))
  )
    throw new Error("Invalid token response");
  const refresh =
    typeof data.refresh_token === "string"
      ? data.refresh_token
      : previousRefresh;
  if (!refresh) throw new Error("Missing refresh token");
  return {
    access_token: data.access_token,
    refresh_token: refresh,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

async function logIn(options: { add?: boolean } = {}): Promise<boolean> {
  let stage = "configuration";
  let status: number | undefined;
  try {
    if (!clientId) throw new Error("Figma Client ID is not configured");
    const redirectUri = browser.identity.getRedirectURL();
    const state = crypto.randomUUID();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope:
        "file_content:read file_metadata:read projects:read current_user:read",
      state,
      response_type: "code",
    }).toString();
    const endpoint = options.add
      ? `https://www.figma.com/switch_user?cont=/oauth?${encodeURIComponent(params)}`
      : `https://www.figma.com/oauth?${params}`;
    stage = "authorization";
    const responseUrl = await browser.identity.launchWebAuthFlow({
      interactive: true,
      url: endpoint,
    });
    stage = "callback";
    if (!responseUrl) throw new Error("Missing OAuth response");
    const callback = new URL(responseUrl);
    const redirect = new URL(redirectUri);
    if (
      callback.origin !== redirect.origin ||
      callback.pathname !== redirect.pathname ||
      callback.searchParams.get("state") !== state ||
      callback.searchParams.has("error")
    )
      throw new Error("Invalid OAuth callback");
    const code = callback.searchParams.get("code");
    if (!code) throw new Error("Missing authorization code");
    stage = "exchange";
    const response = await authRequest("/oauth/exchange", {
      code,
      redirect_uri: redirectUri,
    });
    status = response.status;
    if (!response.ok) throw new Error("OAuth exchange failed");
    const data = await response.json();
    if (
      typeof data.user_id !== "string" ||
      !data.user_id ||
      ["__proto__", "constructor", "prototype"].includes(data.user_id)
    ) {
      throw new Error("Missing account ID");
    }
    const credentials = readTokens(data);
    stage = "profile";
    status = undefined;
    const profileResponse = await fetch("https://api.figma.com/v1/me", {
      headers: { Authorization: `Bearer ${credentials.access_token}` },
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    status = profileResponse.status;
    if (!profileResponse.ok) throw new Error("Profile request failed");
    const profile = await profileResponse.json();
    stage = "storage";
    status = undefined;
    const { state: accounts, result } = await mutateAccounts((accounts) => {
      const duplicate = Boolean(
        accounts.auth[data.user_id] && accounts.options.users[data.user_id],
      );
      accounts.auth[data.user_id] = credentials;
      accounts.options.users[data.user_id] = {
        email: profile.email,
        handle: profile.handle,
        img_url: profile.img_url,
        teams: accounts.options.users[data.user_id]?.teams ?? {},
      };
      if (!duplicate) accounts.options.currentUser = data.user_id;
      return !duplicate;
    });
    applyAccounts(accounts);
    if (!result) {
      alert(
        i18n.t({
          ja: "すでにログイン済みのユーザーです。",
          en: "User already logged in.",
          "zh-cn": "用户已登录。",
          es: "El usuario ya ha iniciado sesión.",
          ko: "이미 로그인된 사용자입니다。",
        }),
      );
      return false;
    }
    await storage.removeItem("local:projects");
    return true;
  } catch {
    // Never log authorization codes, tokens, callback URLs, or response bodies.
    const code = `${stage}${status ? `:${status}` : ""}`;
    console.warn(`OAuth login failed (${code}).`);
    alert(
      `${i18n.t({
        ja: "ログインを完了できませんでした。もう一度お試しください。解決しない場合は、このコードを添えてお問い合わせください。",
        en: "Could not complete login. Please try again. If the problem continues, include this code when contacting support.",
        "zh-cn":
          "无法完成登录。请重试。如果问题仍然存在，请在联系支持时提供此代码。",
        es: "No se pudo completar el inicio de sesión. Inténtalo de nuevo. Si el problema continúa, incluye este código al contactar con soporte.",
        ko: "로그인을 완료하지 못했습니다. 다시 시도해 주세요. 문제가 계속되면 이 코드를 포함하여 문의해 주세요.",
      })} (${code})`,
    );
    return false;
  }
}

async function logOut(): Promise<boolean> {
  const id = store.options.currentUser;
  if (!id) return false;
  if (
    !confirm(
      i18n.t({
        ja: "ログアウトしますか？",
        en: "Log out?",
        "zh-cn": "登出？",
        es: "¿Cerrar sesión?",
        ko: "로그아웃하시겠습니까?",
      }),
    )
  )
    return false;
  try {
    let state: Accounts | undefined;
    // Keep queued refreshes outside the cache-clear/auth-removal transaction.
    // Cache deletion happens before auth watchers can navigate this page away.
    await clearProjectSnapshot(id, async () => {
      await storage.removeItem("local:projects");
      const changed = await mutateAccounts((accounts) => {
        delete accounts.auth[id];
        delete accounts.options.users[id];
        if (accounts.options.currentUser === id) {
          accounts.options.currentUser =
            Object.keys(accounts.options.users).find(
              (key) => accounts.auth[key],
            ) ?? null;
        }
      });
      state = changed.state;
    });
    if (state) applyAccounts(state);
    return true;
  } catch {
    console.warn("Account could not be removed.");
    return false;
  }
}

async function refreshTokens(): Promise<boolean> {
  const id = store.options.currentUser;
  if (!id) return false;
  try {
    const { state, result } = await mutateAccounts(async (accounts) => {
      const current = accounts.auth[id];
      if (!current?.refresh_token || !accounts.options.users[id]) return false;
      // Re-read under the cross-page lock; another page may already have refreshed.
      if (current.expires_at > Date.now() + 30_000) return true;
      const response = await authRequest("/oauth/refresh", {
        refresh_token: current.refresh_token,
      });
      if (response.status === 400) {
        delete accounts.auth[id];
        return false;
      }
      if (!response.ok) throw new Error("Token refresh failed");
      accounts.auth[id] = readTokens(
        await response.json(),
        current.refresh_token,
      );
      return true;
    });
    applyAccounts(state);
    return result;
  } catch {
    console.warn("Token refresh failed.");
    return false;
  }
}
