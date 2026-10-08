let activeRecoveryPromise: Promise<string> | null = null;
let registeredPlayer: any = null;
let registeredDeviceIdRef: { current: string | null } | null = null;
let registeredNotReadyFiredRef: { current: boolean } | null = null;
let internalNotReadyFired = false;

export interface RecoveryStateListener {
  onReconnectingChange?: (isReconnecting: boolean) => void;
  onErrorChange?: (error: string | null) => void;
  onDeviceIdChange?: (deviceId: string | null) => void;
}

const listeners: Set<RecoveryStateListener> = new Set();
let needsRecoveryFlag = false;

export function registerPlayerForRecovery(
  player: any,
  deviceIdRef: { current: string | null },
  notReadyFiredRef?: { current: boolean }
) {
  registeredPlayer = player;
  registeredDeviceIdRef = deviceIdRef;
  registeredNotReadyFiredRef = notReadyFiredRef || null;
  internalNotReadyFired = false;

  if (player && typeof player.addListener === 'function') {
    try {
      player.addListener('not_ready', () => {
        internalNotReadyFired = true;
        if (registeredNotReadyFiredRef) {
          registeredNotReadyFiredRef.current = true;
        }
      });
      player.addListener('ready', () => {
        internalNotReadyFired = false;
        if (registeredNotReadyFiredRef) {
          registeredNotReadyFiredRef.current = false;
        }
      });
    } catch {}
  }
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

export function setNotReadyFired(fired: boolean) {
  internalNotReadyFired = fired;
  if (registeredNotReadyFiredRef) {
    registeredNotReadyFiredRef.current = fired;
  }
}

export function markNotReady(fired: boolean = true) {
  setNotReadyFired(fired);
}

export function isNotReadyFired(): boolean {
  if (registeredNotReadyFiredRef) {
    return !!registeredNotReadyFiredRef.current;
  }
  return internalNotReadyFired;
}

export function notifyDeviceId(deviceId: string | null) {
  if (registeredDeviceIdRef) {
    registeredDeviceIdRef.current = deviceId;
  }
  if (deviceId) {
    setNotReadyFired(false);
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
  // Only one recovery runs at a time; concurrent callers wait for it.
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

      const existingDeviceId = registeredDeviceIdRef?.current;
      const notReady = isNotReadyFired();

      let needsFullReconnect = false;

      // 1. If deviceIdRef has an ID and not_ready has not fired, skip connect.
      // Transfer playback to that ID directly. If the transfer succeeds, recovery is done.
      if (existingDeviceId && !notReady) {
        console.log(`[${new Date().toISOString()}] [Spotify Device Recovery] Device ID present (${existingDeviceId}) and not_ready not fired. Skipping connect, transferring directly.`);
        const transferRes = await fetch('/api/spotify/proxy/me/player', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_ids: [existingDeviceId], play: false }),
        });

        if (transferRes.ok) {
          notifyDeviceId(existingDeviceId);
          await new Promise((r) => setTimeout(r, 600));
          clearNeedsRecovery();
          notifyReconnecting(false);
          return existingDeviceId;
        }

        if (transferRes.status === 404) {
          console.log(`[${new Date().toISOString()}] [Spotify Device Recovery] Direct transfer returned 404. Proceeding to full reconnect.`);
          needsFullReconnect = true;
        } else {
          // Requirement 3: A failed transfer is a failed recovery. Do not log a warning and continue as the current code does.
          const transferErr = await transferRes.text().catch(() => '');
          throw new Error(`Failed to transfer playback (status ${transferRes.status}): ${transferErr}`);
        }
      } else {
        needsFullReconnect = true;
      }

      // 2. If there is no device ID, or not_ready fired, or the transfer in step 1
      // returns 404, do a full reconnect: attach the ready listener first, then
      // player.disconnect(), then player.connect(), and wait up to 10 seconds for
      // ready. Use the new device ID and transfer to it.
      if (needsFullReconnect) {
        console.log(`[${new Date().toISOString()}] [Spotify Device Recovery] Doing full reconnect (attach listener -> disconnect -> connect -> 10s wait)...`);

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
            reject(new Error("Playback recovery timed out waiting for device ready (10s)."));
          }, 10000);

          // 1) Attach ready listener first
          player.addListener('ready', onReady);

          // 2) player.disconnect()
          try {
            if (typeof player.disconnect === 'function') {
              player.disconnect();
            }
          } catch (discErr) {
            console.warn(`[${new Date().toISOString()}] [Spotify Device Recovery] player.disconnect() error:`, discErr);
          }

          // 3) player.connect()
          try {
            const connectRes = player.connect();
            if (connectRes && typeof connectRes.catch === 'function') {
              connectRes.catch((err: any) => {
                if (timer) clearTimeout(timer);
                try {
                  player.removeListener('ready', onReady);
                } catch {}
                reject(err);
              });
            }
          } catch (connErr) {
            if (timer) clearTimeout(timer);
            try {
              player.removeListener('ready', onReady);
            } catch {}
            reject(connErr);
          }
        });

        // Use the new device ID and transfer to it
        notifyDeviceId(newDeviceId);
        setNotReadyFired(false);

        console.log(`[${new Date().toISOString()}] [Spotify Device Recovery] Transferring playback to new device: ${newDeviceId}`);
        const transferRes = await fetch('/api/spotify/proxy/me/player', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_ids: [newDeviceId], play: false }),
        });

        if (!transferRes.ok) {
          // Requirement 3: A failed transfer is a failed recovery. Do not log a warning and continue as the current code does.
          const transferErr = await transferRes.text().catch(() => '');
          throw new Error(`Failed to transfer playback to device ${newDeviceId} (status ${transferRes.status}): ${transferErr}`);
        }

        // Wait a moment for Spotify to propagate transfer
        await new Promise((r) => setTimeout(r, 600));

        clearNeedsRecovery();
        notifyReconnecting(false);
        return newDeviceId;
      }

      throw new Error("Playback recovery ended unexpectedly.");
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
