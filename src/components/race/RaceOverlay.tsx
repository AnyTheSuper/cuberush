import { useEffect, useMemo, useState } from 'react';
import { eventLabel } from '../../lib/events';
import { formatMs } from '../../lib/time';
import { useAppStore } from '../../store/useAppStore';
import { useRaceStore } from '../../store/useRaceStore';
import { Button } from '../ui/Button';
import { RaceOpponentCard } from './RaceOpponentCard';

export function RaceOverlay() {
  const phase = useRaceStore((s) => s.phase);
  const match = useRaceStore((s) => s.match);
  const searchStartedAt = useRaceStore((s) => s.searchStartedAt);
  const countdown = useRaceStore((s) => s.countdown);
  const opponentSolveMs = useRaceStore((s) => s.opponentSolveMs);
  const raceStartedAt = useRaceStore((s) => s.raceStartedAt);
  const opponentFinished = useRaceStore((s) => s.opponentFinished);
  const lastOutcome = useRaceStore((s) => s.lastOutcome);
  const lastEntry = useRaceStore((s) => s.lastEntry);
  const nowMs = useAppStore((s) => s.timer.nowMs);

  const cancelSearch = useRaceStore((s) => s.cancelSearch);
  const enterQueue = useRaceStore((s) => s.enterQueue);
  const beginCountdown = useRaceStore((s) => s.beginCountdown);
  const tickCountdown = useRaceStore((s) => s.tickCountdown);
  const tickOpponent = useRaceStore((s) => s.tickOpponent);
  const leaveRace = useRaceStore((s) => s.leaveRace);
  const getCareer = useRaceStore((s) => s.getCareer);

  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const event = session?.event ?? '333';
  const career = getCareer();

  const [, setTick] = useState(0);

  useEffect(() => {
    if (phase !== 'searching' && phase !== 'racing' && phase !== 'countdown') return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'countdown' || countdown == null) return;
    const id = window.setTimeout(() => tickCountdown(), 1000);
    return () => clearTimeout(id);
  }, [countdown, phase, tickCountdown]);

  useEffect(() => {
    if (phase !== 'racing') return;
    let raf = 0;
    const loop = () => {
      tickOpponent(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, tickOpponent]);

  const searchSec = useMemo(() => {
    if (!searchStartedAt) return 0;
    return Math.min(10, Math.floor((Date.now() - searchStartedAt) / 1000));
  }, [searchStartedAt, phase]);

  const opponentLiveMs = useMemo(() => {
    if (phase !== 'racing' || opponentSolveMs == null || raceStartedAt == null) {
      return null;
    }
    const elapsed = Math.max(0, performance.now() - raceStartedAt);
    return opponentFinished ? opponentSolveMs : Math.min(opponentSolveMs, elapsed);
  }, [opponentFinished, opponentSolveMs, phase, raceStartedAt, nowMs]);

  if (phase === 'idle') return null;

  const outcomeLabel =
    lastOutcome === 'win' || lastOutcome === 'dnf_win'
      ? 'You win!'
      : lastOutcome === 'loss' || lastOutcome === 'dnf_loss'
        ? 'You lose'
        : 'Draw';

  const outcomeClass =
    lastOutcome === 'win' || lastOutcome === 'dnf_win'
      ? 'text-stat-green'
      : lastOutcome === 'loss' || lastOutcome === 'dnf_loss'
        ? 'text-bad'
        : 'text-fg';

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-start justify-center p-3 pt-24 md:justify-end md:pr-8 md:pt-28">
      <div className="pointer-events-auto w-full max-w-md space-y-3">
        <div className="rounded-xl2 border border-purple/35 bg-bg-panel/95 p-4 shadow-purple backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold tracking-[0.2em] text-fg-subtle">
                RACE · {eventLabel(event)}
              </div>
              <div className="mt-1 text-sm text-fg-muted">
                Your rating{' '}
                <span className="font-mono font-semibold text-purple-light">
                  {career.rating}
                </span>
                {' · '}
                {career.wins}W / {career.losses}L
                {career.winStreak > 0 && (
                  <span className="text-stat-yellow"> · {career.winStreak} streak</span>
                )}
              </div>
            </div>
            <Button variant="ghost" onClick={leaveRace}>
              Leave
            </Button>
          </div>

          {phase === 'searching' && (
            <div className="mt-4 space-y-3 text-center">
              <div className="text-sm font-medium text-fg">Searching for opponent…</div>
              <div className="mx-auto h-1.5 w-full overflow-hidden rounded-full bg-bg-inset">
                <div
                  className="h-full bg-purple transition-all duration-300"
                  style={{ width: `${(searchSec / 10) * 100}%` }}
                />
              </div>
              <p className="text-xs text-fg-subtle">
                Finding a live player ({searchSec}s / 10s)…
              </p>
              <Button variant="ghost" onClick={cancelSearch}>
                Cancel
              </Button>
            </div>
          )}

          {phase === 'ready' && match && (
            <div className="mt-4 space-y-3">
              <p className="text-center text-sm text-good">Opponent found!</p>
              <RaceOpponentCard opponent={match.opponent} highlight />
              <p className="text-center text-xs text-fg-subtle">
                Same scramble for both racers. Ready when you are.
              </p>
              <Button variant="purple" className="w-full" onClick={beginCountdown}>
                Start race
              </Button>
            </div>
          )}

          {phase === 'countdown' && countdown != null && (
            <div className="mt-6 grid place-items-center py-6">
              <div className="font-mono text-6xl font-bold text-stat-yellow">
                {countdown <= 0 ? 'GO!' : countdown}
              </div>
              <p className="mt-2 text-sm text-fg-muted">Get on the timer…</p>
            </div>
          )}

          {phase === 'racing' && match && (
            <div className="mt-4 space-y-3">
              <RaceOpponentCard
                opponent={match.opponent}
                highlight={opponentFinished}
                liveMs={opponentLiveMs}
                finished={opponentFinished}
              />
              <p className="text-center text-xs text-fg-subtle">
                {opponentFinished
                  ? 'Opponent finished — beat their time!'
                  : 'Opponent is solving…'}
              </p>
            </div>
          )}

          {phase === 'results' && match && lastEntry && (
            <div className="mt-4 space-y-3">
              <div className={`text-center text-2xl font-bold ${outcomeClass}`}>
                {outcomeLabel}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                <div className="rounded-lg border border-purple/20 bg-bg-inset px-3 py-2">
                  <div className="text-fg-subtle">You</div>
                  <div className="font-mono font-semibold text-fg">
                    {lastEntry.playerMs == null ? 'DNF' : formatMs(lastEntry.playerMs)}
                  </div>
                </div>
                <div className="rounded-lg border border-purple/20 bg-bg-inset px-3 py-2">
                  <div className="text-fg-subtle">{match.opponent.username}</div>
                  <div className="font-mono font-semibold text-fg">
                    {lastEntry.opponentMs == null ? 'DNF' : formatMs(lastEntry.opponentMs)}
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-fg-muted">
                Rating {lastEntry.ratingDelta >= 0 ? '+' : ''}
                {lastEntry.ratingDelta} → {lastEntry.playerRatingAfter}
              </p>
              <div className="flex gap-2">
                <Button variant="purple" className="flex-1" onClick={() => enterQueue(event)}>
                  Race again
                </Button>
                <Button variant="ghost" className="flex-1" onClick={leaveRace}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Header / top bar entry point */
export function RaceButton() {
  const phase = useRaceStore((s) => s.phase);
  const enterQueue = useRaceStore((s) => s.enterQueue);
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const event = session?.event ?? '333';
  const busy = phase !== 'idle';

  return (
    <Button
      variant="purple"
      disabled={busy}
      onClick={() => enterQueue(event)}
    >
      {busy ? 'Racing…' : 'Race'}
    </Button>
  );
}
