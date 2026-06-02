import { useMemo } from 'react';
import type { Discipline } from '../types';
import { disciplineLabel } from '../lib/events';
import { disciplineIcon } from '../lib/xp/icons';
import { useAppStore } from '../store/useAppStore';
import { Card } from './ui/Card';

const DISCIPLINES: Discipline[] = [
  'standard',
  'blind',
  'oneHanded',
  'feet',
  'multi',
  'other',
];

export function XpPanel() {
  const xp = useAppStore((s) => s.xp);

  const rows = useMemo(() => {
    return DISCIPLINES.map((d) => ({
      d,
      total: xp.totalXpByDiscipline[d] ?? 0,
      count: xp.solveCountByDiscipline[d] ?? 0,
    })).sort((a, b) => b.total - a.total);
  }, [xp.solveCountByDiscipline, xp.totalXpByDiscipline]);

  return (
    <Card
      title="XP"
      right={<span className="text-xs text-fg-muted">{xp.totalXp} total</span>}
    >
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-purple/20 bg-purple/10 px-3 py-2">
            <div className="text-xs font-semibold tracking-[0.2em] text-fg-subtle">
              MULTI ROUNDS
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-purple-light">
              {xp.multiRoundsCompleted}
            </div>
          </div>
          <div className="rounded-lg border border-purple/20 bg-purple/10 px-3 py-2">
            <div className="text-xs font-semibold tracking-[0.2em] text-fg-subtle">
              BEST MULTI SIZE
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-purple-light">
              {xp.bestMultiCubesSolved}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-stroke/80 bg-bg-panel2 p-2">
          <div className="mb-2 text-xs font-semibold tracking-[0.2em] text-fg-subtle">
            XP BY DISCIPLINE
          </div>
          <div className="space-y-1">
            {rows.map((r) => (
              <div
                key={r.d}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span title={disciplineLabel(r.d)}>{disciplineIcon(r.d)}</span>
                  <span className="truncate text-fg">{disciplineLabel(r.d)}</span>
                  <span className="text-xs text-fg-muted">({r.count})</span>
                </div>
                <div className="font-mono font-semibold tabular-nums text-fg">
                  {r.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-stroke/80 bg-bg-panel2 p-2">
          <div className="mb-2 text-xs font-semibold tracking-[0.2em] text-fg-subtle">
            ACHIEVEMENTS
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['firstBlindSolve', 'First Blind Solve'],
              ['firstOneHandedSolve', 'First One-Handed Solve'],
              ['firstMultiSolve', 'First Multi Solve'],
              ['multiSolved5Cubes', 'Solved 5 Cubes in Multi'],
              ['multiSolved10Cubes', 'Solved 10 Cubes in Multi'],
              ['blindMaster100', 'Blind Master (100 solves)'],
            ].map(([id, label]) => {
              const a = (xp.achievements as any)[id];
              const unlocked = Boolean(a?.unlocked);
              return (
                <span
                  key={id}
                  className={
                    'rounded-full border px-3 py-1 text-xs font-semibold ' +
                    (unlocked
                      ? 'border-stat-green/40 bg-stat-green/15 text-stat-green'
                      : 'border-stroke/80 bg-white/[0.04] text-fg-muted')
                  }
                  title={unlocked ? 'Unlocked' : 'Locked'}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

