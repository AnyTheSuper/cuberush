import { useMemo, useState } from 'react';
import type { Solve } from '../types';
import { eventLabel, getSessionRoundConfig } from '../lib/events';
import { groupIntoRounds } from '../lib/rounds';
import { roundSessionStats } from '../lib/rounds';
import { formatSolveTime, roundTotalMs, solveToMs } from '../lib/stats';
import { formatMs } from '../lib/time';
import { disciplineIcon } from '../lib/xp/icons';
import { useAppStore } from '../store/useAppStore';
import { RoundDetailsModal } from './RoundDetailsModal';
import { Card } from './ui/Card';

export function TimesList() {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const solves = session?.solves ?? [];
  const deleteSolve = useAppStore((s) => s.deleteSolve);
  const deleteSolves = useAppStore((s) => s.deleteSolves);
  const multiSolve = useAppStore((s) => s.multiSolve);

  const [details, setDetails] = useState<{
    solves: Solve[];
    label: string;
  } | null>(null);

  const { multiMode, roundSize } = getSessionRoundConfig(session, multiSolve);

  const rounds = useMemo(
    () => groupIntoRounds(solves, multiMode ? roundSize : 1),
    [multiMode, roundSize, solves],
  );

  const sessionStats = useMemo(
    () => roundSessionStats(solves, multiMode ? roundSize : 1),
    [multiMode, roundSize, solves],
  );

  const latestCompleteRound = rounds.find((r) => r.complete);

  /** Only one entry — the fastest (newest if tied). */
  const bestKey = useMemo(() => {
    const best = sessionStats.best;
    if (best == null) return null;

    if (multiMode) {
      for (const round of rounds) {
        if (!round.complete) continue;
        const total = roundTotalMs(round.solves, round.solves.length);
        if (total === best) return round.id;
      }
    } else {
      for (const s of solves) {
        if (solveToMs(s) === best) return s.id;
      }
    }
    return null;
  }, [multiMode, rounds, sessionStats.best, solves]);

  return (
    <>
      <Card
        title="Times"
        bodyClassName="flex min-h-0 flex-1 flex-col"
        className="flex max-h-[min(50vh,420px)] flex-col overflow-hidden"
        right={
          <span className="text-xs text-fg-muted">
            {solves.length} solve{solves.length === 1 ? '' : 's'}
          </span>
        }
      >
        {solves.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">
            No solves yet. Stop the timer to record a time.
          </p>
        ) : (
          <>
            <div className="mb-3 shrink-0 flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg border border-purple/30 bg-purple/10 px-2 py-1 text-fg-muted">
                {multiMode ? 'Round avg' : 'Session avg'}:{' '}
                <span className="font-semibold text-purple-light">
                  {sessionStats.avg == null ? '—' : formatMs(sessionStats.avg)}
                </span>
              </span>
              {latestCompleteRound && (
                <span className="rounded-lg border border-purple/30 bg-purple/10 px-2 py-1 text-fg-muted">
                  Latest round:{' '}
                  <span className="font-semibold font-mono text-purple-light">
                    {roundTotalMs(latestCompleteRound.solves, roundSize) == null
                      ? 'DNF'
                      : formatMs(
                          roundTotalMs(
                            latestCompleteRound.solves,
                            roundSize,
                          )!,
                        )}
                  </span>
                </span>
              )}
            </div>

            <ul className="-mx-1 min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto overscroll-contain px-1 pr-1 [scrollbar-gutter:stable]">
              {multiMode
                ? rounds.map((round, roundIdx) => {
                    const roundNum = rounds.length - roundIdx;
                    const total = roundTotalMs(round.solves, round.solves.length);
                    const cubeOrder = [...round.solves]
                      .reverse()
                      .map((s) => eventLabel(s.event))
                      .join(' → ');

                    if (round.complete) {
                      return (
                        <RoundRow
                          key={round.id}
                          label={`R${roundNum}`}
                          timeLabel={
                            total == null ? 'DNF' : formatMs(total)
                          }
                          timeClass={total == null ? 'text-bad' : 'text-fg'}
                          subtitle={cubeOrder}
                          isBest={bestKey === round.id}
                          onDetails={() =>
                            setDetails({
                              solves: round.solves,
                              label: `Round ${roundNum}`,
                            })
                          }
                          onDelete={() =>
                            deleteSolves(round.solves.map((s) => s.id))
                          }
                        />
                      );
                    }

                    return round.solves.map((solve, i) => (
                      <SingleSolveRow
                        key={solve.id}
                        n={`R${roundNum}.${i + 1}`}
                        solve={solve}
                        isBest={false}
                        onDelete={() => deleteSolve(solve.id)}
                      />
                    ));
                  })
                : solves.map((solve, i) => (
                    <SingleSolveRow
                      key={solve.id}
                      n={String(solves.length - i)}
                      solve={solve}
                      isBest={bestKey === solve.id}
                      onDelete={() => deleteSolve(solve.id)}
                    />
                  ))}
            </ul>
          </>
        )}
      </Card>

      <RoundDetailsModal
        open={details != null}
        roundLabel={details?.label ?? ''}
        solves={details?.solves ?? []}
        onClose={() => setDetails(null)}
      />
    </>
  );
}

const bestRowClass =
  'border-stat-yellow/45 bg-stat-yellow/10 ring-1 ring-stat-yellow/35';
const bestLabelClass = 'font-bold text-stat-yellow';

function RoundRow({
  label,
  timeLabel,
  timeClass,
  subtitle,
  isBest,
  onDetails,
  onDelete,
}: {
  label: string;
  timeLabel: string;
  timeClass: string;
  subtitle: string;
  isBest: boolean;
  onDetails: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={
        'flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm transition sm:flex-row sm:items-center ' +
        (isBest
          ? bestRowClass
          : 'border-purple/15 bg-bg-panel2 hover:bg-bg-inset')
      }
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={
            'w-8 shrink-0 text-xs font-semibold ' +
            (isBest ? bestLabelClass : 'text-fg-subtle')
          }
        >
          {label}
        </span>
        <span
          className={
            'shrink-0 font-mono text-lg font-semibold tabular-nums ' +
            (isBest ? 'text-stat-yellow ' : '') +
            timeClass
          }
        >
          {timeLabel}
        </span>
        <span className="truncate text-xs text-fg-muted">{subtitle}</span>
      </div>
      <RowActions onDetails={onDetails} onDelete={onDelete} />
    </li>
  );
}

function SingleSolveRow({
  n,
  solve,
  isBest,
  onDelete,
}: {
  n: string;
  solve: Solve;
  isBest: boolean;
  onDelete: () => void;
}) {
  const timeClass =
    solve.penalty === 'DNF'
      ? 'text-bad'
      : solve.penalty === '+2'
        ? 'text-warn'
        : 'text-fg';

  return (
    <li
      className={
        'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ' +
        (isBest
          ? bestRowClass
          : 'border-transparent bg-white/[0.03] hover:bg-white/[0.06]')
      }
    >
      <span
        className={
          'w-10 shrink-0 text-xs font-semibold ' +
          (isBest ? bestLabelClass : 'text-fg-subtle')
        }
      >
        #{n}
      </span>
      <span
        className={
          'min-w-[5rem] font-mono text-base font-semibold tabular-nums ' +
          (isBest ? 'text-stat-yellow ' : '') +
          timeClass
        }
      >
        {formatSolveTime(solve)}
      </span>
      <span className="truncate text-xs text-fg-muted">
        <span className="mr-2" title={`Discipline: ${solve.discipline}`}>
          {disciplineIcon(solve.discipline)}
        </span>
        {eventLabel(solve.event)}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {solve.xp && (
          <span
            className="rounded border border-purple/20 bg-purple/10 px-2 py-1 text-[10px] font-bold tracking-wide text-purple-light"
            title={
              `XP: ${solve.xp.totalXp}\n` +
              `Base XP: ${solve.xp.baseXp}\n` +
              `Discipline Bonus: ${solve.xp.disciplineBonusXp}\n` +
              `PB Bonus: ${solve.xp.pbBonusXp}\n` +
              `Streak Bonus: ${solve.xp.streakBonusXp}\n` +
              `Multi Bonus: ${solve.xp.multiBonusXp}`
            }
          >
            +{solve.xp.totalXp} XP
          </span>
        )}
        {solve.penalty !== 'OK' && (
          <span
            className={
              'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ' +
              (solve.penalty === 'DNF'
                ? 'bg-bad/20 text-bad'
                : 'bg-warn/20 text-warn')
            }
          >
            {solve.penalty}
          </span>
        )}
        <button
          type="button"
          className="rounded-md border border-stroke/80 px-2 py-1 text-xs text-fg-muted transition hover:border-bad/50 hover:bg-bad/15 hover:text-bad"
          title="Delete this time"
          aria-label={`Delete solve #${n}`}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function RowActions({
  onDetails,
  onDelete,
}: {
  onDetails: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
      <button
        type="button"
        className="rounded-md border border-stat-blue/40 bg-stat-blue/10 px-2 py-1 text-xs text-stat-blue transition hover:bg-stat-blue/20"
        onClick={onDetails}
      >
        Details
      </button>
      <button
        type="button"
        className="rounded-md border border-stroke/80 px-2 py-1 text-xs text-fg-muted transition hover:border-bad/50 hover:bg-bad/15 hover:text-bad"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}
