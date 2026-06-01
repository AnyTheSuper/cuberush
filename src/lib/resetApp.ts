import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

/** Clears timer data, sessions, settings, accounts, then reloads the app. */
export function resetEverything() {
  useAppStore.getState().resetAllData();
  useAuthStore.getState().resetAllData();
  window.location.assign(import.meta.env.BASE_URL);
}
