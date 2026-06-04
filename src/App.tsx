import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { AuthGate } from './components/AuthGate';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { TimerDisplay } from './components/TimerDisplay';
import { TopBar } from './components/TopBar';
import { AchievementPopup } from './components/AchievementPopup';
import { SetupCard } from './components/SetupCard';
import { DashboardPanel } from './components/DashboardPanel';
import { useAuthStore, useIsSignedIn } from './store/useAuthStore';

function AuthLoading() {
  return (
    <div className="grid min-h-full place-items-center bg-bg px-4">
      <p className="text-sm text-fg-muted">Loading your account…</p>
    </div>
  );
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const signedIn = useIsSignedIn();
  const authReady = useAuthStore((s) => s.authReady);
  const userId = useAuthStore((s) => s.userId);
  const initAuth = useAuthStore((s) => s.initAuth);
  const hydrateOfficialScrambles = useAppStore((s) => s.hydrateOfficialScrambles);

  useEffect(() => initAuth(), [initAuth]);

  useEffect(() => {
    if (!authReady) return;
    useAppStore.getState().rehydrateFromStorage();
  }, [authReady, userId]);

  useEffect(() => {
    if (!signedIn) return;
    hydrateOfficialScrambles();
  }, [hydrateOfficialScrambles, signedIn]);

  if (!authReady) {
    return <AuthLoading />;
  }

  if (!signedIn) {
    return <AuthGate />;
  }

  return (
    <div className="min-h-full bg-bg">
      <AchievementPopup />
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div className="px-3 py-3 md:px-5 md:py-5">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 md:grid-cols-[280px_1fr_440px]">
          <aside className="md:sticky md:top-[6.25rem] md:max-h-[calc(100vh-7.25rem)] md:overflow-y-auto">
            <SetupCard />
          </aside>

          <main className="flex flex-col">
            <TopBar />

            <div className="overflow-hidden rounded-xl2 border border-purple/30 shadow-purple">
              <div className="h-full bg-timer-gradient">
                <TimerDisplay />
              </div>
            </div>
          </main>

          <aside className="flex flex-col gap-4 md:sticky md:top-[6.25rem] md:max-h-[calc(100vh-7.25rem)] md:overflow-y-auto">
            <DashboardPanel />
          </aside>
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
