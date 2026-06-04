import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal, type AuthMode } from './AuthModal';
import { Button } from './ui/Button';

export function GuestBanner() {
  const exitGuest = useAuthStore((s) => s.exitGuest);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');

  return (
    <>
      <div className="border-b border-purple/20 bg-purple/10 px-3 py-2 md:px-5">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-fg-muted">
            <span className="font-semibold text-fg">Guest mode</span> — times
            are saved on this device only. Create an account to sync everywhere.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="purple" onClick={() => setAuthOpen(true)}>
              Create account
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                exitGuest();
              }}
            >
              Leave guest mode
            </Button>
          </div>
        </div>
      </div>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={setAuthMode}
      />
    </>
  );
}
