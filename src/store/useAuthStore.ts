import { create } from 'zustand';
import {
  authCryptoErrorMessage,
  hashPassword,
  isAuthCryptoAvailable,
  readPhotoFile,
  validatePassword,
  validateUsername,
  verifyPassword,
} from '../lib/auth';

const AUTH_LS_KEY = 'cube-timer:auth:v1';

export type AccountRecord = {
  username: string;
  passwordHash: string;
  salt: string;
  hashVersion?: number;
  photoDataUrl: string | null;
  createdAt: number;
};

type PersistedAuth = {
  accounts: Record<string, AccountRecord>;
  currentUsername: string | null;
};

function loadAuth(): PersistedAuth {
  try {
    const raw = localStorage.getItem(AUTH_LS_KEY);
    if (!raw) return { accounts: {}, currentUsername: null };
    const parsed = JSON.parse(raw) as PersistedAuth;
    return {
      accounts: parsed.accounts ?? {},
      currentUsername: parsed.currentUsername ?? null,
    };
  } catch {
    return { accounts: {}, currentUsername: null };
  }
}

function saveAuth(data: PersistedAuth): boolean {
  try {
    localStorage.setItem(AUTH_LS_KEY, JSON.stringify(data));
    const readBack = localStorage.getItem(AUTH_LS_KEY);
    return readBack != null && readBack.length > 0;
  } catch {
    return false;
  }
}

function normalizeKey(username: string) {
  return username.trim().toLowerCase();
}

function mergeAccounts(
  a: Record<string, AccountRecord>,
  b: Record<string, AccountRecord>,
) {
  return { ...a, ...b };
}

function getAccountsSnapshot(get: () => AuthState): Record<string, AccountRecord> {
  const disk = loadAuth();
  return mergeAccounts(disk.accounts, get().accounts);
}

const initial = loadAuth();

type AuthState = PersistedAuth & {
  signUp: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signIn: (
    username: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  updatePhoto: (file: File) => Promise<{ ok: true } | { ok: false; error: string }>;
  updatePassword: (
    newPassword: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  removePhoto: () => void;
  getCurrentAccount: () => AccountRecord | null;
  resetAllData: () => void;
  refreshFromStorage: () => void;
};

function applyPersist(state: PersistedAuth): boolean {
  const ok = saveAuth({
    accounts: state.accounts,
    currentUsername: state.currentUsername,
  });
  return ok;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accounts: initial.accounts,
  currentUsername: initial.currentUsername,

  refreshFromStorage: () => {
    const disk = loadAuth();
    set({
      accounts: mergeAccounts(get().accounts, disk.accounts),
      currentUsername: disk.currentUsername ?? get().currentUsername,
    });
  },

  getCurrentAccount: () => {
    const { currentUsername } = get();
    if (!currentUsername) return null;
    const accounts = getAccountsSnapshot(get);
    const key = normalizeKey(currentUsername);
    return accounts[key] ?? null;
  },

  signUp: async (username, password) => {
    if (!isAuthCryptoAvailable()) {
      return { ok: false, error: authCryptoErrorMessage() };
    }

    const userErr = validateUsername(username);
    if (userErr) return { ok: false, error: userErr };
    const passErr = validatePassword(password);
    if (passErr) return { ok: false, error: passErr };

    const trimmed = username.trim();
    const key = normalizeKey(trimmed);
    const accounts = getAccountsSnapshot(get);

    if (accounts[key]) {
      return { ok: false, error: 'That username is already taken.' };
    }

    try {
      const { hash, salt, version } = await hashPassword(password);
      const account: AccountRecord = {
        username: trimmed,
        passwordHash: hash,
        salt,
        hashVersion: version,
        photoDataUrl: null,
        createdAt: Date.now(),
      };

      const nextAccounts = { ...accounts, [key]: account };
      const next: PersistedAuth = {
        accounts: nextAccounts,
        currentUsername: trimmed,
      };

      if (!applyPersist(next)) {
        return {
          ok: false,
          error:
            'Could not save your account in this browser. Turn off private browsing or allow site storage.',
        };
      }

      set(next);
      return { ok: true };
    } catch {
      return { ok: false, error: authCryptoErrorMessage() };
    }
  },

  signIn: async (username, password) => {
    if (!isAuthCryptoAvailable()) {
      return { ok: false, error: authCryptoErrorMessage() };
    }

    const userErr = validateUsername(username);
    if (userErr) return { ok: false, error: userErr };
    if (!password) return { ok: false, error: 'Password is required.' };

    const key = normalizeKey(username);
    const accounts = getAccountsSnapshot(get);
    const account = accounts[key];

    if (!account) {
      return {
        ok: false,
        error:
          'No account with that username on this device. Sign up here first, or use the same browser where you created the account.',
      };
    }

    try {
      const valid = await verifyPassword(
        password,
        account.passwordHash,
        account.salt,
        account.hashVersion ?? 2,
      );
      if (!valid) return { ok: false, error: 'Incorrect password.' };

      const next: PersistedAuth = {
        accounts,
        currentUsername: account.username,
      };

      if (!applyPersist(next)) {
        return {
          ok: false,
          error:
            'Signed in, but could not save session. Allow site storage in your browser settings.',
        };
      }

      set(next);
      return { ok: true };
    } catch {
      return { ok: false, error: authCryptoErrorMessage() };
    }
  },

  signOut: () =>
    set((st) => {
      const next = { ...st, currentUsername: null };
      applyPersist(next);
      return { currentUsername: null };
    }),

  updatePhoto: async (file) => {
    const { currentUsername } = get();
    if (!currentUsername) return { ok: false, error: 'Not signed in.' };

    try {
      const photoDataUrl = await readPhotoFile(file);
      const key = normalizeKey(currentUsername);
      const accounts = getAccountsSnapshot(get);
      const account = accounts[key];
      if (!account) return { ok: false, error: 'Account not found.' };

      const updated = { ...account, photoDataUrl };
      const nextAccounts = { ...accounts, [key]: updated };
      const next = { accounts: nextAccounts, currentUsername };

      if (!applyPersist(next)) {
        return { ok: false, error: 'Could not save photo. Storage may be full or blocked.' };
      }

      set((st) => ({ ...st, accounts: nextAccounts }));
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Could not update photo.',
      };
    }
  },

  updatePassword: async (newPassword) => {
    const passErr = validatePassword(newPassword);
    if (passErr) return { ok: false, error: passErr };

    const { currentUsername } = get();
    if (!currentUsername) return { ok: false, error: 'Not signed in.' };

    if (!isAuthCryptoAvailable()) {
      return { ok: false, error: authCryptoErrorMessage() };
    }

    const key = normalizeKey(currentUsername);
    const accounts = getAccountsSnapshot(get);
    const account = accounts[key];
    if (!account) return { ok: false, error: 'Account not found.' };

    try {
      const { hash, salt, version } = await hashPassword(newPassword);
      const updated = {
        ...account,
        passwordHash: hash,
        salt,
        hashVersion: version,
      };
      const nextAccounts = { ...accounts, [key]: updated };
      const next = { accounts: nextAccounts, currentUsername };

      if (!applyPersist(next)) {
        return { ok: false, error: 'Could not save password.' };
      }

      set((st) => ({ ...st, accounts: nextAccounts }));
      return { ok: true };
    } catch {
      return { ok: false, error: authCryptoErrorMessage() };
    }
  },

  removePhoto: () =>
    set((st) => {
      if (!st.currentUsername) return st;
      const key = normalizeKey(st.currentUsername);
      const accounts = getAccountsSnapshot(get);
      const account = accounts[key];
      if (!account) return st;

      const updated = { ...account, photoDataUrl: null };
      const nextAccounts = { ...accounts, [key]: updated };
      const next = { accounts: nextAccounts, currentUsername: st.currentUsername };
      applyPersist(next);
      return { accounts: nextAccounts };
    }),

  resetAllData: () => {
    try {
      localStorage.removeItem(AUTH_LS_KEY);
    } catch {
      // ignore
    }
    set({ accounts: {}, currentUsername: null });
  },
}));

export function useIsSignedIn() {
  return useAuthStore((s) => s.currentUsername != null);
}
