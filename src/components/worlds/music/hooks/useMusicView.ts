"use client";

import { useSyncExternalStore, useCallback } from "react";

function getViewSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("view");
}

function getServerSnapshot(): string | null {
  return null;
}

const listeners = new Set<() => void>();

function notifyViewChanged(): void {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error("[useMusicView] notification error:", e);
    }
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    notifyViewChanged();
  });
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function useMusicView() {
  const view = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    getViewSnapshot,
    getServerSnapshot
  );

  const isWidgetView = view === "widget";

  const switchToWidget = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("world", "music");
    url.searchParams.set("view", "widget");
    window.history.replaceState(window.history.state, document.title, url.toString());
    notifyViewChanged();

    if (isStandaloneMode()) {
      try {
        window.resizeTo(440, 210);
      } catch {
        // Silently skip if resizing is not permitted
      }
    }
  }, []);

  const expandToFull = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("world", "music");
    url.searchParams.delete("view");
    window.history.replaceState(window.history.state, document.title, url.toString());
    notifyViewChanged();

    if (isStandaloneMode()) {
      try {
        window.resizeTo(1280, 820);
      } catch {
        // Silently skip if resizing is not permitted
      }
    }
  }, []);

  return {
    isWidgetView,
    switchToWidget,
    expandToFull,
    isStandalone: isStandaloneMode(),
  };
}
