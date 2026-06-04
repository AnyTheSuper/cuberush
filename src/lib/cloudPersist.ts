import type { CloudPersisted } from './userStateApi';
import { saveUserState } from './userStateApi';

const DEBOUNCE_MS = 600;

let timer: ReturnType<typeof setTimeout> | null = null;
let pendingUserId: string | null = null;
let pendingPayload: CloudPersisted | null = null;

export function scheduleCloudPersist(userId: string, payload: CloudPersisted) {
  pendingUserId = userId;
  pendingPayload = payload;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void flushCloudPersist();
  }, DEBOUNCE_MS);
}

export async function flushCloudPersist(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const userId = pendingUserId;
  const payload = pendingPayload;
  pendingUserId = null;
  pendingPayload = null;
  if (!userId || !payload) return;
  await saveUserState(userId, payload);
}
