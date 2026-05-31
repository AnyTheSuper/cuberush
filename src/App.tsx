import { useState } from 'react';
import { GraphPanel } from './components/GraphPanel';
import { Header } from './components/Header';
import { TimesList } from './components/TimesList';
import { SessionsPanel } from './components/SessionsPanel';
import { SettingsModal } from './components/SettingsModal';
import { StatsPanel } from './components/StatsPanel';
import { TimerDisplay } from './components/TimerDisplay';
import { TopBar } from './components/TopBar';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-full bg-bg">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div className="px-3 py-3 md:px-5 md:py-5">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-[260px_1fr_380px]">
          <aside className="md:sticky md:top-[6.25rem] md:h-[calc(100vh-7.25rem)]">
            <SessionsPanel />
          </aside>

          <main className="flex flex-col">
            <TopBar />

            <div className="flex-1 overflow-hidden rounded-xl2 border border-purple/30 shadow-purple">
              <div className="h-full bg-timer-gradient">
                <TimerDisplay />
              </div>
            </div>

            <div className="mt-4">
              <StatsPanel />
            </div>
          </main>

          <aside className="flex flex-col gap-4 md:sticky md:top-[6.25rem] md:max-h-[calc(100vh-7.25rem)] md:overflow-y-auto">
            <TimesList />
            <GraphPanel />
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
