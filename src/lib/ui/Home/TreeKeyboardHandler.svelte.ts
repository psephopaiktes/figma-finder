import i18n from "@/lib/i18n.svelte";
import { getTargetUrl, store } from "@/lib/store.svelte";

const focusableSelector = `
  a[href],
  button:not([tabindex="-1"]),
  input,
  summary
`;

const getFocusableElements = (): HTMLElement[] => {
  return Array.from(
    document.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((el) => {
    if (el.offsetParent === null) return false;

    if (
      (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) &&
      el.disabled
    ) {
      return false;
    }

    const parentDetails = el.closest("details");
    if (
      parentDetails &&
      !parentDetails.open &&
      el.tagName.toLowerCase() !== "summary"
    ) {
      return false;
    }

    return true;
  });
};

const moveFocusByOffset = (offset: number) => {
  const focusableElements = getFocusableElements();
  const activeElement = document.activeElement;
  if (!activeElement) return;

  const currentIndex = focusableElements.indexOf(activeElement as HTMLElement);
  if (currentIndex === -1) return;

  const nextIndex = currentIndex + offset;

  if (nextIndex < 0 || nextIndex >= focusableElements.length) return;

  focusableElements[nextIndex]?.focus();
};

const handleParent = (e: KeyboardEvent) => {
  const target = e.currentTarget as HTMLElement;
  const details = target.closest("details");
  if (!details) return;

  // ← to close project
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (details.open) {
      details.open = false;
    }
    return;
  }

  // → to open project, or move focus to first child
  if (e.key === "ArrowRight") {
    e.preventDefault();
    if (!details.open) {
      details.open = true;
    } else {
      const children = details.querySelectorAll<HTMLElement>(focusableSelector);
      const focusables = Array.from(children).filter((el) => {
        return el !== target && el.offsetParent !== null;
      });
      focusables[0]?.focus();
    }
  }

  // ⌘Enter or Ctrl+Enter to open in browser
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    open(getTargetUrl("browser"));
  }

  // ⌥Enter to open in app
  if (e.altKey && e.key === "Enter") {
    e.preventDefault();
    open(getTargetUrl("app"));
  }
};

const handleChild = (e: KeyboardEvent) => {
  const target = e.currentTarget as HTMLElement;
  const details = target.closest("details");
  if (!details) return;
  const summary = details.querySelector("summary") as HTMLElement | null;

  // ← to focus parent
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    summary?.focus();
  }

  // ⌥L to close all projects and focus parent
  if (e.altKey && e.code === "KeyL") {
    e.preventDefault();
    summary?.focus();
    for (const project of store.localProjectState) {
      project.open = false;
    }
  }

  // ⌘Enter or Ctrl+Enter to open in browser
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    open(getTargetUrl("browser"));
  }

  // ⌥Enter to open in app
  if (e.altKey && e.key === "Enter") {
    e.preventDefault();
    open(getTargetUrl("app"));
  }
};

const handleDocument = (e: KeyboardEvent) => {
  // ↑↓ to move focus
  if (e.key === "ArrowDown") {
    e.preventDefault();
    moveFocusByOffset(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    moveFocusByOffset(-1);
  }

  // ^N or ^P to move focus
  if (e.ctrlKey && !e.shiftKey && !e.altKey) {
    if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      moveFocusByOffset(1);
    } else if (e.key.toLowerCase() === "p") {
      e.preventDefault();
      moveFocusByOffset(-1);
    }
  }

  // ⌥L to close all projects
  if (e.altKey && e.code === "KeyL") {
    e.preventDefault();
    for (const project of store.localProjectState) {
      project.open = false;
    }
  }

  // ⌘R or F5 to reload
  if (
    ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") ||
    e.key === "F5"
  ) {
    const now = Date.now();
    if (now - +(localStorage.lastReloadTime || 0) < 500) {
      alert(
        i18n.t({
          en: "Please wait a moment before reloading.",
          ja: "リロードするまでしばらくお待ちください。",
          "zh-cn": "请稍等片刻再重新加载。",
          es: "Espere un momento antes de volver a cargar.",
        }),
      );
      e.preventDefault();
      return;
    }
    localStorage.lastReloadTime = String(now);
    e.preventDefault();
    location.reload();
  }

  // ⌘F or / to focus search input
  if (
    (!e.isComposing &&
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === "f") ||
    (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === "/")
  ) {
    const input = document.getElementById("search");
    if (input && document.activeElement !== input) {
      e.preventDefault();
      (input as HTMLElement).focus();
    }
  }
};

export default {
  handleParent,
  handleChild,
  handleDocument,
};
