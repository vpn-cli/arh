"use client";

import React, { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallAppButton = React.memo(function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already in standalone display mode
    const isStandaloneQuery = window.matchMedia("(display-mode: standalone)");
    const checkStandalone = () => {
      const standalone = isStandaloneQuery.matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };

    checkStandalone();
    isStandaloneQuery.addEventListener("change", checkStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      isStandaloneQuery.removeEventListener("change", checkStandalone);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (err) {
      console.warn("App installation prompt error:", err);
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="mw-btn group px-2.5 py-1 min-h-[28px] bg-white/70 hover:bg-[var(--color-vibrant)] text-[var(--color-dark)] hover:text-[var(--on-vibrant)] border border-[var(--color-muted)] hover:border-[var(--color-vibrant)] rounded-full flex items-center gap-1.5 transition-colors shadow-xs"
      aria-label="Install app"
      title="Install Music World as Desktop App"
    >
      <span className="text-[var(--color-vibrant)] group-hover:text-[var(--on-vibrant)] transition-colors leading-none text-caption font-bold">
        ↓
      </span>
      <span className="font-pixel text-caption font-bold tracking-wider uppercase transition-colors">
        Install app
      </span>
    </button>
  );
});

InstallAppButton.displayName = "InstallAppButton";
