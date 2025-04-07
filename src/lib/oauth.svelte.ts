import i18n from "@/lib/i18n.svelte";
import { store } from "@/lib/store.svelte";
const client_id = import.meta.env.WXT_FIGMA_ID;
const client_secret = import.meta.env.WXT_FIGMA_SECRET;

export default {
  logIn,
  logOut,
  refreshTokens,
};

/**
 * Initiates the OAuth 2.0 authorization flow for logging in a user via Figma's API.
 * @async
 * @throws {Error} If the OAuth login process fails or if any required data is missing.
 * @see https://www.figma.com/developers/api#oauth2
 * @param options - Additional options for the login process.
 * @returns Whether the user has successfully logged in.
 */
async function logIn(options: { add?: boolean } = {}): Promise<boolean> {
  const redirect_uri = browser.identity.getRedirectURL();
  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    scope: "files:read",
    state: "null",
    response_type: "code",
  }).toString();

  const endpoint = options.add
    ? `https://www.figma.com/switch_user?cont=/oauth?${encodeURIComponent(params)}`
    : `https://www.figma.com/oauth?${params}`;

  try {
    const responseUrl = await browser.identity.launchWebAuthFlow({
      interactive: true,
      url: endpoint,
    });
    if (!responseUrl) {
      throw new Error("Failed to get response URL");
    }

    const code = new URL(responseUrl).searchParams.get("code");
    if (!code) {
      throw new Error("Authorization code not found");
    }

    // Get token
    const tokenResponse = await fetch("https://api.figma.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${client_id}:${client_secret}`)}`,
      },
      body: new URLSearchParams({
        redirect_uri,
        grant_type: "authorization_code",
        code,
      }).toString(),
    });
    if (!tokenResponse.ok) {
      throw new Error(`Failed to fetch access token: ${tokenResponse.status}`);
    }
    const oauthData = await tokenResponse.json();

    // Get user profile
    const userResponse = await fetch("https://api.figma.com/v1/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${oauthData.access_token}`,
      },
    });
    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user data: ${userResponse.status}`);
    }
    const userData = await userResponse.json();

    // Handle the case where the user already exists
    if (store.options.users[oauthData.user_id]) {
      alert(
        i18n.t({
          ja: "すでにログイン済みのユーザーです。",
          en: "User already logged in.",
          "zh-cn": "用户已登录。",
          es: "El usuario ya ha iniciado sesión.",
        }),
      );
      throw new Error(`User already logged in: ${oauthData.user_id}`);
    }

    // Save data to the Svelte store and browser.storage
    store.options.users[oauthData.user_id] = {
      access_token: oauthData.access_token,
      expires_at: Date.now() + oauthData.expires_in * 1000,
      refresh_token: oauthData.refresh_token,
      email: userData.email,
      handle: userData.handle,
      img_url: userData.img_url,
      teams: {},
    };
    store.options.currentUser = oauthData.user_id;
    storage.setItem("sync:options", store.options);
    storage.removeItem("local:projects");

    return true;
  } catch (error) {
    console.error("OAuth login failed:", error);
    return false;
  }
}

/**
 * Signs out the current user by clearing stored authentication data.
 * @returns Whether the log-out was successful.
 */
function logOut(): boolean {
  if (
    store.options.currentUser &&
    store.options.users[store.options.currentUser]
  ) {
    const result = confirm(
      i18n.t({
        ja: "ログアウトしますか？",
        en: "Log out?",
        "zh-cn": "登出？",
        es: "¿Cerrar sesión?",
      }),
    );
    if (!result) return false;

    delete store.options.users[store.options.currentUser];
    const userIds = Object.keys(store.options.users);
    store.options.currentUser = userIds.length > 0 ? userIds[0] : null;
    storage.setItem("sync:options", store.options);
    storage.removeItem("local:projects");
    return true;
  }
  console.warn("No user logged in.");
  return false;
}

/**
 * Refreshes the OAuth access token using the stored refresh token.
 * @async
 * @returns {Promise<boolean>} Whether the token refresh was successful.
 */
async function refreshTokens(): Promise<boolean> {
  if (!store.options.currentUser) {
    console.warn("No current user logged in.");
    return false;
  }

  const user = store.options.users[store.options.currentUser];
  if (!user || !user.refresh_token) {
    console.warn("No refresh token available.");
    return false;
  }

  try {
    const tokenResponse = await fetch(
      "https://api.figma.com/v1/oauth/refresh",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${client_id}:${client_secret}`)}`,
        },
        body: new URLSearchParams({
          refresh_token: user.refresh_token,
        }).toString(),
      },
    );
    if (!tokenResponse.ok) {
      throw new Error(
        `Failed to refresh access token: ${tokenResponse.status}`,
      );
    }
    const oauthData = await tokenResponse.json();

    // Save data to the Svelte store and browser.storage
    user.access_token = oauthData.access_token;
    user.expires_at = Date.now() + oauthData.expires_in * 1000;
    storage.setItem("sync:options", store.options);

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);

    return false;
  }
}
