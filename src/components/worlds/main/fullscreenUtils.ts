export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function requestNativeFullscreen(
  el: HTMLElement | null,
  videoEl?: HTMLVideoElement | null,
  onSuccess?: () => void,
  onError?: () => void
): boolean {
  type FsElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    mozRequestFullScreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
  };
  type FsVideo = HTMLVideoElement & {
    webkitEnterFullscreen?: () => void;
  };

  const target = el as FsElement | null;
  const video = videoEl as FsVideo | null;

  try {
    // 1. Synchronously call real Fullscreen API on the wrapper element (no await or async tick before it)
    if (target?.requestFullscreen) {
      const p = target.requestFullscreen();
      if (p && typeof p.then === "function") {
        p.then(() => onSuccess?.()).catch(() => {
          if (video?.webkitEnterFullscreen) {
            try {
              video.webkitEnterFullscreen();
              onSuccess?.();
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
      return true;
    }

    // 2. WebKit prefixed element fullscreen
    if (target?.webkitRequestFullscreen) {
      target.webkitRequestFullscreen();
      onSuccess?.();
      return true;
    }

    // 3. Mozilla / MS prefixed element fullscreen
    if (target?.mozRequestFullScreen) {
      target.mozRequestFullScreen();
      onSuccess?.();
      return true;
    }
    if (target?.msRequestFullscreen) {
      target.msRequestFullscreen();
      onSuccess?.();
      return true;
    }

    // 4. On iPhone Safari where element fullscreen is not supported, fall back to video.webkitEnterFullscreen()
    if (video?.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
      onSuccess?.();
      return true;
    }

    onError?.();
    return false;
  } catch (err) {
    if (video?.webkitEnterFullscreen) {
      try {
        video.webkitEnterFullscreen();
        onSuccess?.();
        return true;
      } catch {
        onError?.();
        return false;
      }
    }
    onError?.();
    return false;
  }
}

export function exitNativeFullscreen() {
  type FsDoc = Document & {
    webkitExitFullscreen?: () => Promise<void> | void;
    mozCancelFullScreen?: () => Promise<void> | void;
    msExitFullscreen?: () => Promise<void> | void;
    webkitFullscreenElement?: Element;
  };
  const anyDoc = document as FsDoc;
  if (typeof document === "undefined") return;

  try {
    if (document.fullscreenElement || anyDoc.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (anyDoc.webkitExitFullscreen) {
        anyDoc.webkitExitFullscreen();
      } else if (anyDoc.mozCancelFullScreen) {
        anyDoc.mozCancelFullScreen();
      } else if (anyDoc.msExitFullscreen) {
        anyDoc.msExitFullscreen();
      }
    }
  } catch {
    // Ignore errors on exit fullscreen
  }
}
