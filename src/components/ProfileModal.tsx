import { useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PasswordInput } from './ui/PasswordInput';

export function ProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const currentUsername = useAuthStore((s) => s.currentUsername);
  const accounts = useAuthStore((s) => s.accounts);
  const account =
    currentUsername != null
      ? accounts[currentUsername.trim().toLowerCase()]
      : null;
  const updatePhoto = useAuthStore((s) => s.updatePhoto);
  const removePhoto = useAuthStore((s) => s.removePhoto);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const signOut = useAuthStore((s) => s.signOut);

  const fileRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!account) return null;

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setMessage(null);
    setBusy(true);
    const result = await updatePhoto(file);
    setBusy(false);
    if (!result.ok) setError(result.error);
    else setMessage('Profile photo updated.');
  };

  const handlePasswordSave = async () => {
    setError(null);
    setMessage(null);
    setBusy(true);
    const result = await updatePassword(password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPassword('');
    setMessage('Password updated.');
  };

  const handleSignOut = () => {
    signOut();
    setPassword('');
    setMessage(null);
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} title="My profile" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-purple/40 bg-bg-panel2">
            {account.photoDataUrl ? (
              <img
                src={account.photoDataUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xl font-bold text-purple-light">
                {account.username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-fg">
              {account.username}
            </div>
            <div className="text-xs text-fg-subtle">CubeRush account</div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-fg">Profile photo</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handlePhoto(e.target.files?.[0])}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </Button>
            {account.photoDataUrl && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  removePhoto();
                  setMessage('Photo removed.');
                  setError(null);
                }}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <PasswordInput
            id="profile-password"
            label="Password"
            value={password}
            autoComplete="new-password"
            placeholder="Enter a new password to change it"
            onChange={setPassword}
          />
          <p className="text-xs text-fg-subtle">
            Password is hidden by default. Press Show to see what you type.
          </p>
          <Button
            type="button"
            variant="purple"
            disabled={busy || !password}
            onClick={() => void handlePasswordSave()}
          >
            Save password
          </Button>
        </div>

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

        <div className="flex flex-col gap-2 border-t border-stroke/80 pt-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="danger" onClick={handleSignOut}>
            Sign out
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
