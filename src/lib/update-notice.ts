export const majorUpdateNoticeKey = "local:majorUpdateNotice";

export type MajorUpdateNotice = { version: string; major: number };
type NoticeState = { pendingVersion: string | null; dismissedMajor: number };

function majorVersion(version: unknown): number | null {
  if (
    typeof version !== "string" ||
    !/^(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})$/.test(version)
  )
    return null;
  const parts = version.split(".").map(Number);
  return parts.every((part) => part <= 65535) && parts.some((part) => part > 0)
    ? (parts[0] ?? null)
    : null;
}

async function readState(): Promise<NoticeState> {
  const value = await storage.getItem<unknown>(majorUpdateNoticeKey);
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const dismissedMajor =
    typeof input.dismissedMajor === "number" &&
    Number.isInteger(input.dismissedMajor) &&
    input.dismissedMajor >= 0 &&
    input.dismissedMajor <= 65535
      ? input.dismissedMajor
      : 0;
  const pendingVersion =
    typeof input.pendingVersion === "string" ? input.pendingVersion : null;
  const pendingMajor = majorVersion(pendingVersion);
  return {
    pendingVersion:
      pendingMajor !== null && pendingMajor > dismissedMajor
        ? pendingVersion
        : null,
    dismissedMajor,
  };
}

function locked<T>(callback: () => Promise<T>): Promise<T> {
  return navigator.locks.request("figma-finder-major-update-notice", callback);
}

export async function recordMajorUpdate(
  previousVersion: string,
  currentVersion: string,
): Promise<void> {
  const previous = majorVersion(previousVersion);
  const current = majorVersion(currentVersion);
  if (previous === null || current === null || current <= previous) return;
  await locked(async () => {
    const state = await readState();
    const pending = majorVersion(state.pendingVersion);
    if (
      current <= state.dismissedMajor ||
      (pending !== null && pending >= current)
    )
      return;
    await storage.setItem(majorUpdateNoticeKey, {
      pendingVersion: currentVersion,
      dismissedMajor: state.dismissedMajor,
    });
  });
}

export async function readMajorUpdateNotice(
  currentVersion: string,
): Promise<MajorUpdateNotice | null> {
  const current = majorVersion(currentVersion);
  if (current === null) return null;
  return locked(async () => {
    const { pendingVersion } = await readState();
    return pendingVersion !== null && majorVersion(pendingVersion) === current
      ? { version: pendingVersion, major: current }
      : null;
  });
}

export async function dismissMajorUpdate(major: number): Promise<void> {
  if (!Number.isInteger(major) || major < 1 || major > 65535) return;
  await locked(async () => {
    const state = await readState();
    const next = {
      pendingVersion:
        majorVersion(state.pendingVersion) === major
          ? null
          : state.pendingVersion,
      dismissedMajor: Math.max(state.dismissedMajor, major),
    };
    await storage.setItem(majorUpdateNoticeKey, next);
  });
}
