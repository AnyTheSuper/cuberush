import { create } from 'zustand';
import {
  readPhotoFile,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../lib/auth';
import { isGuestMode, setGuestMode } from '../lib/storage';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type AccountRecord = {
  username: string;
  email: string;
  photoDataUrl: string | null;
};

type AuthState = {
  authReady: boolean;
  isGuest: boolean;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;

  initAuth: () => () => void;
  continueAsGuest: () => void;
  exitGuest: () => void;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<
    | { ok: true; needsEmailConfirmation?: boolean }
    | { ok: false; error: string }
  >;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  updatePhoto: (file: File) => Promise<{ ok: true } | { ok: false; error: string }>;
  updatePassword: (
    newPassword: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  removePhoto: () => Promise<void>;
  getCurrentAccount: () => AccountRecord | null;
  resetAllData: () => void;
};

function supabaseAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirm your email first, then sign in.';
  }
  return message;
}

async function loadProfile(userId: string) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('username, photo_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('loadProfile:', error.message);
    return null;
  }
  return data;
}

async function upsertProfile(
  userId: string,
  patch: { username?: string; photo_url?: string | null },
) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false as const, error: 'Cloud sync is not configured.' };

  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    ...patch,
  });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

function applySession(
  set: (partial: Partial<AuthState>) => void,
  session: { user: { id: string; email?: string | null } } | null,
  profile?: { username: string | null; photo_url: string | null } | null,
) {
  if (!session?.user) {
    set({
      userId: null,
      email: null,
      displayName: null,
      photoUrl: null,
      isGuest: isGuestMode(),
    });
    return;
  }

  setGuestMode(false);
  const email = session.user.email ?? null;
  set({
    userId: session.user.id,
    email,
    displayName:
      profile?.username?.trim() ||
      (email ? email.split('@')[0] : 'Player'),
    photoUrl: profile?.photo_url ?? null,
    isGuest: false,
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authReady: !isSupabaseConfigured,
  isGuest: isGuestMode(),
  userId: null,
  email: null,
  displayName: null,
  photoUrl: null,

  continueAsGuest: () => {
    setGuestMode(true);
    const supabase = getSupabase();
    if (supabase) void supabase.auth.signOut();
    set({
      isGuest: true,
      userId: null,
      email: null,
      displayName: null,
      photoUrl: null,
      authReady: true,
    });
  },

  exitGuest: () => {
    setGuestMode(false);
    set({
      isGuest: false,
      userId: null,
      email: null,
      displayName: null,
      photoUrl: null,
    });
  },

  initAuth: () => {
    const supabase = getSupabase();
    if (!supabase) {
      set({ authReady: true, isGuest: isGuestMode() });
      return () => {};
    }

    let cancelled = false;

    const syncSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) {
        console.error('getSession:', error.message);
        set({ authReady: true });
        return;
      }

      const session = data.session;
      if (!session?.user) {
        applySession(set, null);
        set({ authReady: true });
        return;
      }

      const profile = await loadProfile(session.user.id);
      if (cancelled) return;
      applySession(set, session, profile);
      set({ authReady: true });
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        applySession(set, null);
        return;
      }
      void loadProfile(session.user.id).then((profile) => {
        applySession(set, session, profile);
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  },

  getCurrentAccount: () => {
    const { userId, email, displayName, photoUrl } = get();
    if (!userId || !email) return null;
    return {
      username: displayName ?? email.split('@')[0] ?? 'Player',
      email,
      photoDataUrl: photoUrl,
    };
  },

  signUp: async (email, password, displayName) => {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        error: 'Cloud accounts are not configured on this deployment.',
      };
    }

    const emailErr = validateEmail(email);
    if (emailErr) return { ok: false, error: emailErr };
    const passErr = validatePassword(password);
    if (passErr) return { ok: false, error: passErr };

    const name = displayName?.trim();
    if (name) {
      const nameErr = validateUsername(name);
      if (nameErr) return { ok: false, error: nameErr };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { ok: false, error: 'Cloud sync is not configured.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) return { ok: false, error: supabaseAuthError(error.message) };

    const user = data.user;
    if (!user) {
      return { ok: false, error: 'Sign up failed. Try again.' };
    }

    const username = name || normalizedEmail.split('@')[0] || 'Player';
    await upsertProfile(user.id, { username });

    if (data.session) {
      applySession(set, data.session, { username, photo_url: null });
      return { ok: true };
    }

    return {
      ok: true,
      needsEmailConfirmation: true,
    };
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        error: 'Cloud accounts are not configured on this deployment.',
      };
    }

    const emailErr = validateEmail(email);
    if (emailErr) return { ok: false, error: emailErr };
    if (!password) return { ok: false, error: 'Password is required.' };

    const supabase = getSupabase();
    if (!supabase) {
      return { ok: false, error: 'Cloud sync is not configured.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return { ok: false, error: supabaseAuthError(error.message) };
    if (!data.session) {
      return { ok: false, error: 'Sign in failed. Try again.' };
    }

    const profile = await loadProfile(data.session.user.id);
    applySession(set, data.session, profile);
    return { ok: true };
  },

  signOut: async () => {
    setGuestMode(false);
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    set({
      isGuest: false,
      userId: null,
      email: null,
      displayName: null,
      photoUrl: null,
    });
  },

  updatePhoto: async (file) => {
    const { userId } = get();
    if (!userId) return { ok: false, error: 'Not signed in.' };

    try {
      const photoDataUrl = await readPhotoFile(file);
      const result = await upsertProfile(userId, { photo_url: photoDataUrl });
      if (!result.ok) return { ok: false, error: result.error };
      set({ photoUrl: photoDataUrl });
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

    const { userId } = get();
    if (!userId) return { ok: false, error: 'Not signed in.' };

    const supabase = getSupabase();
    if (!supabase) {
      return { ok: false, error: 'Cloud sync is not configured.' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: supabaseAuthError(error.message) };
    return { ok: true };
  },

  removePhoto: async () => {
    const { userId } = get();
    if (!userId) return;
    const result = await upsertProfile(userId, { photo_url: null });
    if (result.ok) set({ photoUrl: null });
  },

  resetAllData: () => {
    setGuestMode(false);
    const supabase = getSupabase();
    if (supabase) void supabase.auth.signOut();
    set({
      isGuest: false,
      userId: null,
      email: null,
      displayName: null,
      photoUrl: null,
    });
  },
}));

export function useIsSignedIn() {
  return useAuthStore((s) => s.authReady && s.userId != null);
}

export function useCanAccessApp() {
  return useAuthStore((s) => s.authReady && (s.userId != null || s.isGuest));
}

export function useIsGuest() {
  return useAuthStore((s) => s.authReady && s.isGuest);
}
