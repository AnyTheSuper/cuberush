import { useEffect, useState } from 'react';
import { AuthModal, type AuthMode } from './AuthModal';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';

export function AuthGate() {
  const refreshFromStorage = useAuthStore((s) => s.refreshFromStorage);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const baseUrl = import.meta.env.BASE_URL;

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="grid min-h-full place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl2 border border-purple/30 bg-bg-panel p-8 text-center shadow-purple">
        <img
          src={`${baseUrl}cuberush-logo.png`}
          alt="CubeRush"
          className="mx-auto h-16 w-auto object-contain"
        />
        <h1 className="mt-6 text-xl font-semibold text-fg">Welcome to CubeRush</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Sign in or create an account to save your sessions and times on this
          device.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="purple" className="w-full sm:w-auto" onClick={() => openAuth('signin')}>
            Sign in
          </Button>
          <Button variant="ghost" className="w-full sm:w-auto" onClick={() => openAuth('signup')}>
            Sign up
          </Button>
        </div>
        <p className="mt-6 text-xs text-fg-subtle">
          Accounts are stored locally in your browser on this device.
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
