export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function requestNativeFullscreen(
  el: HTMLElement | null,
  fallbackEl?: HTMLElement | null,
  onSuccess?: () => void,
  onError?: () => void
) {
  // Target the requested element (specifically the HTMLVideoElement) first for native OS media fullscreen,
  // falling back to fallbackEl or documentElement.
  const target =
    el ||
    fallbackEl ||
    (typeof document !== "undefined" ? document.documentElement : null);
  if (!target) {
    onError?.();
    return;
  }

  type FsElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    webkitEnterFullscreen?: () => void;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };

  const fsTarget = target as FsElement;

  try {
    if (fsTarget.requestFullscreen) {
      const promise = fsTarget.requestFullscreen();
      if (promise && typeof promise.then === "function") {
        promise
          .then(() => {
            onSuccess?.();
          })
          .catch((err: unknown) => {
            console.warn("Native fullscreen request on target rejected:", err);
            const fallback = fallbackEl || (typeof document !== "undefined" ? document.documentElement : null);
            if (fallback && fallback !== fsTarget && (fallback as FsElement).requestFullscreen) {
              try {
                (fallback as FsElement).requestFullscreen?.()
                  .then(() => onSuccess?.())
                  .catch(() => onError?.());
              } catch {
                onError?.();
              }
            } else {
              onError?.();
            }
          });
      } else {
        onSuccess?.();
      }
    } else if (fsTarget.webkitRequestFullscreen) {
      fsTarget.webkitRequestFullscreen();
      onSuccess?.();
    } else if (fsTarget.webkitEnterFullscreen) {
      fsTarget.webkitEnterFullscreen();
      onSuccess?.();
    } else if (fsTarget.mozRequestFullScreen) {
      fsTarget.mozRequestFullScreen();
      onSuccess?.();
    } else if (fsTarget.msRequestFullscreen) {
      fsTarget.msRequestFullscreen();
      onSuccess?.();
    } else {
      onError?.();
    }
  } catch (err: unknown) {
    console.warn("Synchronous fullscreen request threw:", err);
    onError?.();
  }
}

export function exitNativeFullscreen() {
  type FsDoc = Document & {
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
    webkitFullscreenElement?: Element;
  };
  const anyDoc = document as FsDoc;
  if (document.fullscreenElement || anyDoc.webkitFullscreenElement) {
    if (anyDoc.exitFullscreen) {
      anyDoc.exitFullscreen().catch(() => {});
    } else if (anyDoc.webkitExitFullscreen) {
      anyDoc.webkitExitFullscreen();
    } else if (anyDoc.mozCancelFullScreen) {
      anyDoc.mozCancelFullScreen();
    } else if (anyDoc.msExitFullscreen) {
      anyDoc.msExitFullscreen();
    }
  }
}
