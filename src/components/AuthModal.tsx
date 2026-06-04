import { useState } from 'react';
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

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'signup';
  const title = isSignUp ? 'Sign up' : 'Sign in';

  const resetForm = () => {
    setEmail('');
    setDisplayName('');
    setPassword('');
    setError(null);
    setMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const result = isSignUp
        ? await signUp(email, password, displayName)
        : await signIn(email, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (isSignUp && 'needsEmailConfirmation' in result && result.needsEmailConfirmation) {
        setMessage(
          'Account created. Check your email to confirm, then sign in here.',
        );
        setPassword('');
        onSwitchMode('signin');
        return;
      }

      resetForm();
      onClose();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={handleClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-fg-muted">
          {isSignUp
            ? 'Create a cloud account with your email and password.'
            : 'Sign in to load your synced timer data.'}
        </p>

        <div>
          <label htmlFor="auth-email" className="text-sm font-medium text-fg">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            className="mt-2 w-full rounded-lg border border-stroke bg-bg-panel2 px-3 py-2 text-sm text-fg outline-none focus:border-accent/60"
            value={email}
            autoComplete="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="auth-display-name" className="text-sm font-medium text-fg">
              Display name <span className="text-fg-subtle">(optional)</span>
            </label>
            <input
              id="auth-display-name"
              className="mt-2 w-full rounded-lg border border-stroke bg-bg-panel2 px-3 py-2 text-sm text-fg outline-none focus:border-accent/60"
              value={displayName}
              autoComplete="nickname"
              placeholder="your_name"
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        )}

        <PasswordInput
          id="auth-password"
          label="Password"
          value={password}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          onChange={setPassword}
        />

        {message && (
          <p className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-sm text-good">
            {message}
          </p>
        )}
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
              setMessage(null);
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
