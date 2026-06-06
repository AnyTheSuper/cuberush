import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import App from './App.tsx';
import { clearAllAppStorageBuckets } from './lib/storage';

const CRASH_FLAG_KEY = 'cube-timer:crash-recovery:v1';

function markCrashed(reason: string) {
  try {
    localStorage.setItem(
      CRASH_FLAG_KEY,
      JSON.stringify({ at: Date.now(), reason }),
    );
  } catch {
    // ignore
  }
}

function clearCrashFlag() {
  try {
    localStorage.removeItem(CRASH_FLAG_KEY);
  } catch {
    // ignore
  }
}

function tryRecoverFromPreviousCrash() {
  try {
    const raw = localStorage.getItem(CRASH_FLAG_KEY);
    if (!raw) return;
    // One-shot recovery: clear app buckets then reload, and remove the flag so we don't loop.
    clearCrashFlag();
    clearAllAppStorageBuckets();
    window.location.reload();
  } catch {
    // ignore
  }
}

// If last load crashed, auto-recover by clearing stored app state.
tryRecoverFromPreviousCrash();

window.addEventListener('error', (e) => {
  markCrashed(e.error instanceof Error ? e.error.message : String(e.message));
});
window.addEventListener('unhandledrejection', (e) => {
  const reason =
    (e.reason instanceof Error ? e.reason.message : String(e.reason)) ||
    'unhandledrejection';
  markCrashed(reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
