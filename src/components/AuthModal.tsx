import { useEffect, useState } from 'react';
import { authCryptoErrorMessage, isAuthCryptoAvailable } from '../lib/auth';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PasswordInput } from './ui/PasswordInput';

export type AuthMode = 'signin' | 'signup';

export function AuthModal({
  open,
  mode,
  onClose,
  onSwitchMode,
}: {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
}) {
  const signUp = useAuthStore((s) => s.signUp);
  const signIn = useAuthStore((s) => s.signIn);
  const refreshFromStorage = useAuthStore((s) => s.refreshFromStorage);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'signup';
  const title = isSignUp ? 'Sign up' : 'Sign in';

  useEffect(() => {
    if (open) refreshFromStorage();
  }, [open, refreshFromStorage]);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthCryptoAvailable()) {
      setError(authCryptoErrorMessage());
      return;
    }

    setBusy(true);
    try {
      const result = isSignUp
        ? await signUp(username, password)
        : await signIn(username, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      resetForm();
      onClose();
    } catch {
      setError(authCryptoErrorMessage());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-fg-muted">
          {isSignUp
            ? 'Create an account with a username and password.'
            : 'Enter your username and password to continue.'}
        </p>
        <p className="text-xs text-fg-subtle">
          Accounts are saved only on this device and this website URL. Sign up on
          the live site if you have not already.
        </p>

        <div>
          <label htmlFor="auth-username" className="text-sm font-medium text-fg">
            Username
          </label>
          <input
            id="auth-username"
            className="mt-2 w-full rounded-lg border border-stroke bg-bg-panel2 px-3 py-2 text-sm text-fg outline-none focus:border-accent/60"
            value={username}
            autoComplete="username"
            placeholder="your_name"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <PasswordInput
          id="auth-password"
          label="Password"
          value={password}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          onChange={setPassword}
        />

        {error && (
          <p className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="purple" disabled={busy}>
            {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </div>

        <p className="text-center text-sm text-fg-muted">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="font-semibold text-purple-light hover:text-fg"
            onClick={() => {
              setError(null);
              onSwitchMode(isSignUp ? 'signin' : 'signup');
            }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </form>
    </Modal>
  );
}
