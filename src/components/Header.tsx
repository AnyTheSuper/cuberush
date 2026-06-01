import { useState, type ReactNode } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal, type AuthMode } from './AuthModal';
import { CubeRulesModal } from './CubeRulesModal';
import { ProfileModal } from './ProfileModal';

export function Header({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  const currentUsername = useAuthStore((s) => s.currentUsername);
  const accounts = useAuthStore((s) => s.accounts);
  const account =
    currentUsername != null
      ? accounts[currentUsername.trim().toLowerCase()]
      : null;

  const baseUrl = import.meta.env.BASE_URL;
  const signedIn = currentUsername != null;

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-purple/25 bg-bg backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-3 py-3 md:px-5">
          <a href={baseUrl} className="flex min-w-0 items-center">
            <img
              src={`${baseUrl}cuberush-logo.png`}
              alt="CubeRush — Solve faster. Track better. Be legendary."
              className="h-14 w-auto max-w-[min(100%,420px)] shrink-0 object-contain object-left sm:h-16 md:h-[4.75rem]"
            />
          </a>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {signedIn && account && (
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="inline-flex max-w-[10rem] items-center gap-2 rounded-lg border border-stroke/80 bg-bg-panel2 px-2 py-1.5 text-xs font-semibold text-fg transition hover:border-purple/40 hover:bg-purple/10 sm:max-w-[12rem] sm:px-2.5 sm:text-sm"
                title="My profile"
              >
                <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-purple/30 bg-bg-inset">
                  {account.photoDataUrl ? (
                    <img
                      src={account.photoDataUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-xs font-bold text-purple-light">
                      {account.username.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="truncate">{account.username}</span>
              </button>
            )}

            <HeaderIconButton
              label="Rules"
              onClick={() => setRulesOpen(true)}
            >
              <RulesIcon />
              <span className="hidden sm:inline">Rules</span>
            </HeaderIconButton>

            <HeaderIconButton label="Settings" onClick={onOpenSettings}>
              <SettingsIcon />
            </HeaderIconButton>

            {!signedIn && (
              <>
                <HeaderIconButton label="Sign in" onClick={() => openAuth('signin')}>
                  <span>Sign in</span>
                </HeaderIconButton>
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="hidden rounded-lg bg-btn-purple px-2.5 py-2 text-xs font-semibold text-white shadow-purple transition hover:brightness-110 sm:inline sm:px-3 sm:text-sm"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <CubeRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onSwitchMode={setAuthMode}
      />
    </>
  );
}

function HeaderIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-lg border border-stroke/80 bg-bg-panel2 px-2.5 py-2 text-xs font-semibold text-fg-muted transition hover:border-purple/40 hover:bg-purple/10 hover:text-fg sm:px-3 sm:text-sm"
    >
      {children}
    </button>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function RulesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h8" />
    </svg>
  );
}
