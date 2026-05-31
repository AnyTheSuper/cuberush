import { useMemo } from 'react';
import { getSessionRoundConfig } from '../lib/events';
import { roundSessionStats } from '../lib/rounds';
import { formatMs } from '../lib/time';
import { useAppStore } from '../store/useAppStore';
import { Card } from './ui/Card';

const STAT_COLORS: Record<string, string> = {
  Best: 'text-stat-green',
  Average: 'text-stat-blue',
  Ao5: 'text-stat-pink',
  Ao12: 'text-stat-yellow',
  Rounds: 'text-stat-pink',
  Count: 'text-stat-pink',
};

export function StatsPanel() {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const multiSolve = useAppStore((s) => s.multiSolve);
  const solves = session?.solves ?? [];

  const { multiMode, roundSize } = getSessionRoundConfig(session, multiSolve);

  const stats = useMemo(
    () => roundSessionStats(solves, multiMode ? roundSize : 1),
    [multiMode, roundSize, solves],
  );

  const countLabel = multiMode ? 'Rounds' : 'Count';

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <StatCard
        label="Best"
        value={stats.best == null ? '—' : formatMs(stats.best)}
      />
      <StatCard
        label="Average"
        value={stats.avg == null ? '—' : formatMs(stats.avg)}
      />
      <StatCard
        label="Ao5"
        value={stats.ao5 == null ? '—' : formatMs(stats.ao5)}
      />
      <StatCard
        label="Ao12"
        value={stats.ao12 == null ? '—' : formatMs(stats.ao12)}
      />
      <StatCard label={countLabel} value={String(stats.roundCount)} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  const valueColor = STAT_COLORS[label] ?? 'text-fg';

  return (
    <Card className="border-purple/25 px-0 py-0">
      <div className="px-4 py-3">
        <div className="text-xs font-semibold tracking-[0.2em] text-fg-subtle">
          {label.toUpperCase()}
        </div>
        <div
          className={`mt-2 text-2xl font-semibold tabular-nums ${valueColor}`}
        >
          {value}
        </div>
      </div>
    </Card>
  );
}
