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
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Card
        title="Dashboard"
        className="flex min-h-[min(55vh,520px)] flex-1 flex-col overflow-hidden max-md:flex-none md:min-h-0"
        bodyClassName="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="shrink-0">
            <StatsPanel />
          </div>
          <TimesList />
        </div>
      </Card>

      {hasGraph && (
        <div className="shrink-0">
          <GraphPanel />
        </div>
      )}
    </div>
  );
}

