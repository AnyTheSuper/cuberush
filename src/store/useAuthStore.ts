import { create } from 'zustand';
import {
  hashPassword,
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

function saveAuth(data: PersistedAuth) {
  try {
    localStorage.setItem(AUTH_LS_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

function normalizeKey(username: string) {
  return username.trim().toLowerCase();
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
};

function persist(state: PersistedAuth) {
  saveAuth({
    accounts: state.accounts,
    currentUsername: state.currentUsername,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accounts: initial.accounts,
  currentUsername: initial.currentUsername,

  getCurrentAccount: () => {
    const { accounts, currentUsername } = get();
    if (!currentUsername) return null;
    const key = normalizeKey(currentUsername);
    return accounts[key] ?? null;
  },

  signUp: async (username, password) => {
    const userErr = validateUsername(username);
    if (userErr) return { ok: false, error: userErr };
    const passErr = validatePassword(password);
    if (passErr) return { ok: false, error: passErr };

    const trimmed = username.trim();
    const key = normalizeKey(trimmed);
    if (get().accounts[key]) {
      return { ok: false, error: 'That username is already taken.' };
    }

    const { hash, salt } = await hashPassword(password);
    const account: AccountRecord = {
      username: trimmed,
      passwordHash: hash,
      salt,
      photoDataUrl: null,
      createdAt: Date.now(),
    };

    set((st) => {
      const accounts = { ...st.accounts, [key]: account };
      const next = { accounts, currentUsername: trimmed };
      persist(next);
      return next;
    });

    return { ok: true };
  },

  signIn: async (username, password) => {
    const userErr = validateUsername(username);
    if (userErr) return { ok: false, error: userErr };
    if (!password) return { ok: false, error: 'Password is required.' };

    const key = normalizeKey(username);
    const account = get().accounts[key];
    if (!account) {
      return { ok: false, error: 'No account with that username.' };
    }

    const valid = await verifyPassword(
      password,
      account.passwordHash,
      account.salt,
    );
    if (!valid) return { ok: false, error: 'Incorrect password.' };

    set((st) => {
      const next = { ...st, currentUsername: account.username };
      persist(next);
      return next;
    });

    return { ok: true };
  },

  signOut: () =>
    set((st) => {
      const next = { ...st, currentUsername: null };
      persist(next);
      return next;
    }),

  updatePhoto: async (file) => {
    const { currentUsername, accounts } = get();
    if (!currentUsername) return { ok: false, error: 'Not signed in.' };

    try {
      const photoDataUrl = await readPhotoFile(file);
      const key = normalizeKey(currentUsername);
      const account = accounts[key];
      if (!account) return { ok: false, error: 'Account not found.' };

      const updated = { ...account, photoDataUrl };
      set((st) => {
        const nextAccounts = { ...st.accounts, [key]: updated };
        const next = { ...st, accounts: nextAccounts };
        persist(next);
        return next;
      });
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

    const { currentUsername, accounts } = get();
    if (!currentUsername) return { ok: false, error: 'Not signed in.' };

    const key = normalizeKey(currentUsername);
    const account = accounts[key];
    if (!account) return { ok: false, error: 'Account not found.' };

    const { hash, salt } = await hashPassword(newPassword);
    const updated = { ...account, passwordHash: hash, salt };

    set((st) => {
      const nextAccounts = { ...st.accounts, [key]: updated };
      const next = { ...st, accounts: nextAccounts };
      persist(next);
      return next;
    });

    return { ok: true };
  },

  removePhoto: () =>
    set((st) => {
      if (!st.currentUsername) return st;
      const key = normalizeKey(st.currentUsername);
      const account = st.accounts[key];
      if (!account) return st;

      const updated = { ...account, photoDataUrl: null };
      const accounts = { ...st.accounts, [key]: updated };
      const next = { ...st, accounts };
      persist(next);
      return next;
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
