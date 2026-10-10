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

export const USER_RECOVERY_ERROR_MESSAGE = "Couldn't connect to Spotify. Try again.";
export const POST_READY_RETRY_DELAYS = [400, 800, 1600];

export async function transferPlaybackWithRetry(
  deviceId: string,
  delays: number[] = POST_READY_RETRY_DELAYS
): Promise<Response> {
  const maxAttempts = delays.length + 1; // 4 attempts total

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(
      `[${new Date().toISOString()}] [Spotify Device Recovery] Transferring playback to device: ${deviceId} (attempt ${attempt + 1}/${maxAttempts})`
    );

    const transferRes = await fetch('/api/spotify/proxy/me/player', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_ids: [deviceId], play: false }),
    });

    if (transferRes.ok) {
      return transferRes;
    }

    if (transferRes.status === 404) {
      if (attempt < delays.length) {
        const delayMs = delays[attempt];
        console.warn(
          `[${new Date().toISOString()}] [Spotify Device Recovery] Transfer returned 404 for device ${deviceId} (attempt ${attempt + 1}/${maxAttempts}). Retrying in ${delayMs}ms...`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
    }

    // Non-404 failure or exhausted all 404 attempts
    const transferErr = await transferRes.text().catch(() => '');
    console.error(
      `[${new Date().toISOString()}] [Spotify Device Recovery] Transfer playback failed for device ${deviceId} (status ${transferRes.status}): ${transferErr}`
    );
    throw new Error(USER_RECOVERY_ERROR_MESSAGE);
  }

  throw new Error(USER_RECOVERY_ERROR_MESSAGE);
}

export async function recoverPlaybackDevice(reason: string = 'unspecified'): Promise<string> {
  console.log(
    `[${new Date().toISOString()}] [Spotify Device Recovery] recoverPlaybackDevice called. Reason: ${reason}`
  );

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
          notifyRecoveryError(null);
          notifyReconnecting(false);
          return existingDeviceId;
        }

        if (transferRes.status === 404) {
          console.log(`[${new Date().toISOString()}] [Spotify Device Recovery] Direct transfer returned 404. Proceeding to full reconnect.`);
          needsFullReconnect = true;
        } else {
          // Requirement 3: A failed transfer is a failed recovery. Do not log a warning and continue as the current code does.
          const transferErr = await transferRes.text().catch(() => '');
          console.error(
            `[${new Date().toISOString()}] [Spotify Device Recovery] Direct transfer failed for device ${existingDeviceId} (status ${transferRes.status}): ${transferErr}`
          );
          throw new Error(USER_RECOVERY_ERROR_MESSAGE);
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

        await transferPlaybackWithRetry(newDeviceId);

        // Wait a moment for Spotify to propagate transfer
        await new Promise((r) => setTimeout(r, 600));

        clearNeedsRecovery();
        notifyRecoveryError(null);
        notifyReconnecting(false);
        return newDeviceId;
      }

      throw new Error("Playback recovery ended unexpectedly.");
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] [Spotify Device Recovery Failed]`, err);
      notifyRecoveryError(USER_RECOVERY_ERROR_MESSAGE);
      notifyReconnecting(false);
      throw err;
    } finally {
      activeRecoveryPromise = null;
    }
  })();

  return await activeRecoveryPromise;
}
