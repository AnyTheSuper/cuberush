import { useMemo } from 'react';
import { getSessionRoundConfig } from '../lib/events';
import { roundSessionStats } from '../lib/rounds';
import { formatMs } from '../lib/time';
import { useAppStore } from '../store/useAppStore';

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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      <StatPill label="Best" value={stats.best == null ? '—' : formatMs(stats.best)} />
      <StatPill
        label="Average"
        value={stats.avg == null ? '—' : formatMs(stats.avg)}
      />
      <StatPill label="Ao5" value={stats.ao5 == null ? '—' : formatMs(stats.ao5)} />
      <StatPill
        label="Ao12"
        value={stats.ao12 == null ? '—' : formatMs(stats.ao12)}
      />
      <StatPill label={countLabel} value={String(stats.roundCount)} />
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  const valueColor = STAT_COLORS[label] ?? 'text-fg';

  return (
    <div className="min-w-0 rounded-xl border border-purple/25 bg-bg-panel px-3 py-2 shadow-panel">
      <div className="truncate text-[10px] font-semibold tracking-[0.22em] text-fg-subtle">
        {label.toUpperCase()}
      </div>
      <div className={`mt-1 truncate text-xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}
