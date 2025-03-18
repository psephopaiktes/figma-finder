// https://www.figma.com/developers/api#oauth2

import { store } from "@/lib/store.svelte";
const client_id = import.meta.env.WXT_FIGMA_ID;
const client_secret = import.meta.env.WXT_FIGMA_SECRET;

const signIn = async () => {
  const redirect_uri = browser.identity.getRedirectURL();
  const params = new URLSearchParams({
    client_id,
    redirect_uri,
    scope: "files:read",
    state: "null",
    response_type: "code",
  }).toString();

  try {
    const responseUrl = await browser.identity.launchWebAuthFlow({
      interactive: true,
      url: `https://www.figma.com/oauth?${params}`,
    });
    if (!responseUrl) {
      console.error("Failed to get response URL");
      return;
    }

    const code = new URL(responseUrl).searchParams.get("code");
    if (!code) {
      console.error("Authorization code not found");
      return;
    }

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
      console.error("Failed to fetch access token", await tokenResponse.text());
      return;
    }
    const oauthData = await tokenResponse.json();

    // TODO:
    store.options.users[oauthData.user_id] = {
      access_token: oauthData.access_token,
      expires_at: Date.now() + oauthData.expires_in * 1000,
      refresh_token: oauthData.refresh_token,
      // handle: userData.user.handle,
      // img_url: userData.user.img_url,
    };
    console.dir(store.options.users); //TODO: Consoleでexpires_at確認
    storage.setItem("sync:options", store.options);
    store.currentUser = oauthData.user_id;
  } catch (error) {
    console.error("OAuth login failed", error);
  }
};

// TODO2 Refresh関数用意

export default {
  signIn,
};
