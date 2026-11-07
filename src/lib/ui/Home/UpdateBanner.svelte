<script lang="ts">
import i18n from "@/lib/i18n.svelte";
import {
  dismissMajorUpdate,
  type MajorUpdateNotice,
  majorUpdateNoticeKey,
  readMajorUpdateNotice,
} from "@/lib/update-notice";

let notice = $state<MajorUpdateNotice | null>(null);
let saving = $state(false);
const releaseUrl = (version: string) =>
  `https://github.com/psephopaiktes/figma-finder/releases/tag/v${version}`;

onMount(() => {
  const version = browser.runtime.getManifest().version;
  let active = true;
  let generation = 0;
  async function refresh() {
    const requested = ++generation;
    try {
      const next = await readMajorUpdateNotice(version);
      if (active && generation === requested) notice = next;
    } catch {
      console.warn("Update notice could not be loaded.");
    }
  }
  const unwatch = storage.watch(majorUpdateNoticeKey, () => void refresh());
  void refresh();
  return () => {
    active = false;
    unwatch();
  };
});

async function dismiss() {
  if (!notice || saving) return;
  const current = notice;
  saving = true;
  try {
    await dismissMajorUpdate(current.major);
    if (notice?.major === current.major) notice = null;
  } catch {
    console.warn("Update notice could not be dismissed.");
  } finally {
    saving = false;
  }
}

async function openRelease(event: MouseEvent) {
  if (event.type === "auxclick" && event.button !== 1) return;
  event.preventDefault();
  if (!notice || saving) return;
  const current = notice;
  const active = !event.ctrlKey && !event.metaKey && event.button !== 1;
  saving = true;
  try {
    // Persist before opening a tab, since following the link may close a popup.
    await dismissMajorUpdate(current.major);
    if (notice?.major === current.major) notice = null;
    await browser.tabs.create({
      url: releaseUrl(current.version),
      active,
    });
  } catch {
    console.warn("Release notes could not be opened.");
  } finally {
    saving = false;
  }
}
</script>

<div role="status">
  {#if notice}
    <div class="updateBanner">
      <a
        href={releaseUrl(notice.version)}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={saving}
        onclick={openRelease}
        onauxclick={openRelease}
      >
        {i18n.t({
          en: "Figma Finder has been updated",
          ja: "Figma Finder をアップデートしました",
          "zh-cn": "Figma Finder 已更新",
          es: "Figma Finder se ha actualizado",
          ko: "Figma Finder가 업데이트되었습니다",
        })}
        <span>v{notice.version}</span>
      </a>
      <button
        type="button"
        disabled={saving}
        onclick={dismiss}
        aria-label={i18n.t({
          en: "Dismiss update notification",
          ja: "更新通知を閉じる",
          "zh-cn": "关闭更新通知",
          es: "Cerrar aviso de actualización",
          ko: "업데이트 알림 닫기",
        })}
      >
        <svg-icon src="/img/icon/close.svg" aria-hidden="true"></svg-icon>
      </button>
    </div>
  {/if}
</div>

<style>
  .updateBanner {
    display: flex;
    align-items: center;
    gap: var(--sp-xs);
    margin: var(--sp-m) var(--sp-m) 0;
    padding: var(--sp-xs);
    border-radius: 10px;
    background: var(--color-theme);
    /* Keep readable dark text on the blue surface in both light and dark themes. */
    color: #111;

    a {
      flex: 1;
      min-inline-size: 0;
      padding: var(--sp-s);
      border-radius: 6px;
      line-height: 1.5;
      text-decoration: none;
      span {
        white-space: nowrap;
      }
    }
    button {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      min-inline-size: 32px;
      min-block-size: 32px;
      border-radius: 6px;
      svg-icon {
        font-size: 20px;
      }
    }
    :is(a, button):hover {
      background: rgb(0 0 0 / 0.05);
    }
    :is(a, button):focus-visible {
      outline: 2px solid currentColor;
    }
  }
</style>
