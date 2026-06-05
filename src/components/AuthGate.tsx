import { useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal, type AuthMode } from './AuthModal';
import { Button } from './ui/Button';

export function AuthGate() {
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const baseUrl = import.meta.env.BASE_URL;
  const cloudAvailable = isSupabaseConfigured;

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleGuest = () => {
    continueAsGuest();
    queueMicrotask(() => {
      useAppStore.getState().rehydrateFromStorage();
      useAppStore.getState().hydrateOfficialScrambles();
    });
  };

  return (
    <div className="grid min-h-full place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl2 border border-purple/30 bg-bg-panel p-8 text-center shadow-purple">
        <img
          src={`${baseUrl}cuberush-logo.png`}
          alt="CubeRush — free online Rubik's cube timer"
          className="mx-auto h-16 w-auto object-contain"
        />
        <h1 className="mt-6 text-xl font-semibold text-fg">
          Free Rubik&rsquo;s Cube Timer
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          {cloudAvailable
            ? 'WCA scrambles, session stats, and guest mode. Sign in to sync across devices, or try it locally without an account.'
            : 'WCA scrambles, session stats, and progression charts — try the full timer on this device with no account.'}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {cloudAvailable && (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="purple"
                className="w-full sm:w-auto"
                onClick={() => openAuth('signin')}
              >
                Sign in
              </Button>
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => openAuth('signup')}
              >
                Sign up
              </Button>
            </div>
          )}
          <Button
            variant={cloudAvailable ? 'ghost' : 'purple'}
            className="w-full"
            onClick={handleGuest}
          >
            Continue as guest
          </Button>
        </div>

        <p className="mt-6 text-xs text-fg-subtle">
          Guest mode saves data in this browser only. Accounts sync to the cloud.
        </p>
      </div>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={setAuthMode}
      />
    </div>
  );
}
