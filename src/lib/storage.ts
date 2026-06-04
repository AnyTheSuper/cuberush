const AUTH_LS_KEY = 'cube-timer:auth:v1';
const APP_LS_PREFIX = 'cube-timer:v1';
const GUEST_MODE_KEY = 'cube-timer:guest-mode:v1';

export function isGuestMode(): boolean {
  try {
    return localStorage.getItem(GUEST_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setGuestMode(enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(GUEST_MODE_KEY, '1');
    else localStorage.removeItem(GUEST_MODE_KEY);
  } catch {
    // ignore
  }
}

function normalizeKey(username: string) {
  return username.trim().toLowerCase();
}

export function currentUsernameFromStorage(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { currentUsername?: string | null };
    const u = parsed.currentUsername ?? null;
    return u ? normalizeKey(u) : null;
  } catch {
    return null;
  }
}

/** Storage key for app data scoped to guest, cloud account, or legacy anon. */
export function appStorageKey(): string {
  if (isGuestMode()) return `${APP_LS_PREFIX}:guest`;
  const u = currentUsernameFromStorage();
  return u ? `${APP_LS_PREFIX}:${u}` : `${APP_LS_PREFIX}:anon`;
}

/** Removes *all* CubeRush timer data buckets (all accounts + anon). */
export function clearAllAppStorageBuckets() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k === APP_LS_PREFIX || k.startsWith(`${APP_LS_PREFIX}:`)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}

