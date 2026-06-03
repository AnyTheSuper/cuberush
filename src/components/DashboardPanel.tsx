import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TimesList } from './TimesList';
import { StatsPanel } from './StatsPanel';
import { GraphPanel } from './GraphPanel';
import { Card } from './ui/Card';

export function DashboardPanel() {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const solves = session?.solves ?? [];

  const hasGraph = useMemo(() => solves.length >= 3, [solves.length]);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Dashboard">
        <div className="space-y-4">
          <StatsPanel />
          <TimesList />
        </div>
      </Card>

      {hasGraph && <GraphPanel />}
    </div>
  );
}

