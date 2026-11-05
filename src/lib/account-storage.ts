import type { Accounts, AuthTokens, Options, User } from "@/types";

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown) => (typeof value === "string" ? value : "");
const accountId = (value: string) =>
  value.length > 0 &&
  !["__proto__", "prototype", "constructor"].includes(value);

export function cleanOptions(value: unknown): Options {
  const input = object(value);
  const users: Record<string, User> = Object.fromEntries(
    Object.entries(object(input.users))
      .filter(([id]) => accountId(id))
      .map(([id, value]) => {
        const user = object(value);
        return [
          id,
          {
            email: text(user.email),
            handle: text(user.handle),
            img_url: text(user.img_url),
            teams: Object.fromEntries(
              Object.entries(object(user.teams)).flatMap(([id, name]) =>
                typeof name === "string" ? [[id, name]] : [],
              ),
            ),
          },
        ];
      }),
  );
  return {
    currentUser:
      typeof input.currentUser === "string" &&
      Object.hasOwn(users, input.currentUser)
        ? input.currentUser
        : null,
    theme: text(input.theme) || "system",
    locale: typeof input.locale === "string" ? input.locale : null,
    openInApp: input.openInApp === true,
    users,
  };
}

function cleanAuth(value: unknown): Record<string, AuthTokens> {
  return Object.fromEntries(
    Object.entries(object(value)).flatMap(([id, value]) => {
      const input = object(value);
      const access = text(input.access_token);
      const refresh = text(input.refresh_token);
      return accountId(id) && (access || refresh)
        ? [
            [
              id,
              {
                access_token: access,
                refresh_token: refresh,
                expires_at:
                  typeof input.expires_at === "number" &&
                  Number.isFinite(input.expires_at)
                    ? input.expires_at
                    : 0,
              },
            ],
          ]
        : [];
    }),
  );
}

// Web Locks coordinate every extension page on Chrome 126+ and Firefox 140+.
// Keeping the lock through refresh prevents two pages rotating the same token.
function locked<T>(callback: () => Promise<T>): Promise<T> {
  return navigator.locks.request("figma-finder-accounts", callback);
}

async function readAccounts(): Promise<Accounts> {
  const input = await storage.getItem("sync:options");
  const storedAuth = await storage.getItem("local:auth");
  const auth = cleanAuth(storedAuth);
  const legacyUsers = object(object(input).users);
  const legacyAuth = cleanAuth(legacyUsers);
  let copied = false;
  for (const [id, tokens] of Object.entries(legacyAuth)) {
    if (!Object.hasOwn(auth, id)) {
      auth[id] = tokens;
      copied = true;
    }
  }
  // Save credentials locally before removing the only legacy copy from sync.
  if (copied) await storage.setItem("local:auth", auth);
  const options = cleanOptions(input);
  const hasLegacyTokens = Object.values(legacyUsers).some((value) => {
    const user = object(value);
    return ["access_token", "refresh_token", "expires_at"].some((key) =>
      Object.hasOwn(user, key),
    );
  });
  if (hasLegacyTokens) await storage.setItem("sync:options", options);
  return { options, auth };
}

export function loadAccounts(): Promise<Accounts> {
  return locked(readAccounts);
}

export function persistOptions(
  options: Options,
  selectCurrent = false,
): Promise<void> {
  // Snapshot synchronously so Svelte effects track nested preference changes.
  const snapshot = cleanOptions(options);
  return locked(async () => {
    const state = await readAccounts();
    // A stale settings page must not erase a newly added account or resurrect
    // metadata removed by a logout in another page.
    for (const id of Object.keys(state.options.users)) {
      if (snapshot.users[id]) state.options.users[id] = snapshot.users[id];
    }
    const selected = snapshot.currentUser;
    await storage.setItem("sync:options", {
      ...snapshot,
      users: state.options.users,
      currentUser:
        selectCurrent &&
        selected &&
        state.auth[selected] &&
        state.options.users[selected]
          ? selected
          : state.options.currentUser,
    });
  });
}

export function mutateAccounts<T>(
  change: (state: Accounts) => Promise<T> | T,
): Promise<{ state: Accounts; result: T }> {
  return locked(async () => {
    const state = await readAccounts();
    const result = await change(state);
    await storage.setItem("local:auth", state.auth);
    state.options = cleanOptions(state.options);
    await storage.setItem("sync:options", state.options);
    return { state, result };
  });
}
