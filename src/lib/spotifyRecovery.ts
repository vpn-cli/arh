let activeRecoveryPromise: Promise<string> | null = null;
let registeredPlayer: any = null;
let registeredDeviceIdRef: { current: string | null } | null = null;

export interface RecoveryStateListener {
  onReconnectingChange?: (isReconnecting: boolean) => void;
  onErrorChange?: (error: string | null) => void;
  onDeviceIdChange?: (deviceId: string | null) => void;
}

const listeners: Set<RecoveryStateListener> = new Set();
let needsRecoveryFlag = false;

export function registerPlayerForRecovery(
  player: any,
  deviceIdRef: { current: string | null }
) {
  registeredPlayer = player;
  registeredDeviceIdRef = deviceIdRef;
}

export function subscribeRecoveryState(listener: RecoveryStateListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyReconnecting(isReconnecting: boolean) {
  listeners.forEach((l) => l.onReconnectingChange?.(isReconnecting));
}

export function notifyRecoveryError(error: string | null) {
  listeners.forEach((l) => l.onErrorChange?.(error));
}

export function notifyDeviceId(deviceId: string | null) {
  if (registeredDeviceIdRef) {
    registeredDeviceIdRef.current = deviceId;
  }
  listeners.forEach((l) => l.onDeviceIdChange?.(deviceId));
}

export function markNeedsRecovery() {
  needsRecoveryFlag = true;
}

export function getNeedsRecovery(): boolean {
  return needsRecoveryFlag;
}

export function clearNeedsRecovery() {
  needsRecoveryFlag = false;
}

export async function recoverPlaybackDevice(): Promise<string> {
  // Requirement 5: "Only one recovery runs at a time; concurrent callers wait for it."
  if (activeRecoveryPromise) {
    console.log(`[${new Date().toISOString()}] [Spotify Device Recovery] Reusing ongoing recovery promise.`);
    return await activeRecoveryPromise;
  }

  activeRecoveryPromise = (async () => {
    notifyReconnecting(true);
    notifyRecoveryError(null);
    try {
      const player = registeredPlayer;
      if (!player) {
        throw new Error("Spotify player is not initialized.");
      }

      console.log(`[${new Date().toISOString()}] [Spotify Device Recovery] Calling player.connect()...`);

      // Requirement 5: "Call player.connect(), wait up to 5 seconds for ready"
      const newDeviceId = await new Promise<string>((resolve, reject) => {
        let timer: any = null;

        const onReady = ({ device_id }: { device_id: string }) => {
          if (timer) clearTimeout(timer);
          try {
            player.removeListener('ready', onReady);
          } catch {}
          console.log(`[${new Date().toISOString()}] [Spotify SDK Event: ready] Received during recovery: device_id=${device_id}`);
          resolve(device_id);
        };

        timer = setTimeout(() => {
          try {
            player.removeListener('ready', onReady);
          } catch {}
          reject(new Error("Playback recovery timed out waiting for device ready (5s)."));
        }, 5000);

        player.addListener('ready', onReady);
        player.connect().catch((err: any) => {
          if (timer) clearTimeout(timer);
          try {
            player.removeListener('ready', onReady);
          } catch {}
          reject(err);
        });
      });

      // Update device ID in ref and store
      notifyDeviceId(newDeviceId);

      // Requirement 5: "transfer playback to the new device ID"
      console.log(`[${new Date().toISOString()}] [Spotify Device Recovery] Transferring playback to device: ${newDeviceId}`);
      const transferRes = await fetch('/api/spotify/proxy/me/player', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [newDeviceId], play: false }),
      });

      if (!transferRes.ok) {
        const transferErr = await transferRes.text().catch(() => '');
        console.warn(`[${new Date().toISOString()}] [Spotify Device Recovery] Transfer playback status: ${transferRes.status}`, transferErr);
      }

      // Wait a moment for Spotify to propagate transfer
      await new Promise((r) => setTimeout(r, 600));

      clearNeedsRecovery();
      notifyReconnecting(false);
      return newDeviceId;
    } catch (err: any) {
      const msg = err?.message || "Failed to recover Spotify playback device.";
      console.error(`[${new Date().toISOString()}] [Spotify Device Recovery Failed]`, err);
      notifyRecoveryError(msg);
      notifyReconnecting(false);
      throw err;
    } finally {
      activeRecoveryPromise = null;
    }
  })();

  return await activeRecoveryPromise;
}
