export const DEFAULT_AUTH_BASE_URL =
  "https://figma-finder.hirataakira6.workers.dev";

export function getAuthBaseUrl(value?: string): string {
  const url = new URL(value || DEFAULT_AUTH_BASE_URL);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("The authentication endpoint must be an HTTPS origin");
  }
  return url.origin;
}
