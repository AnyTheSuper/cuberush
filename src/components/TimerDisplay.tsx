import { useMemo } from 'react';
import {
  eventLabel,
  isLiveMultiMode,
  isMultiComplete,
  multiSolveEventAt,
  multiSolveTotal,
} from '../lib/events';
import { roundTotalMs } from '../lib/stats';
import { formatMs } from '../lib/time';
import { useTimerInput } from '../hooks/useTimerInput';
import { useAppStore } from '../store/useAppStore';
import { useRaceStore } from '../store/useRaceStore';

export function TimerDisplay() {
  const timer = useAppStore((s) => s.timer);
  const settings = useAppStore((s) => s.settings);
  const multiSolve = useAppStore((s) => s.multiSolve);
  const lastEarned = useAppStore((s) => s.xp.lastEarned);
  const solves = useAppStore(
    (s) => s.sessions.find((x) => x.id === s.currentSessionId)?.solves ?? [],
  );
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const racePhase = useRaceStore((s) => s.phase);
  const inRace = racePhase === 'racing' || racePhase === 'countdown';

  const {
    inspectionRemainingMs,
    inspectionPenalty,
    runningElapsedMs,
    inspectionLimitSec,
    onTimerClick,
    onTimerTouchStart,
  } = useTimerInput();

  const multiDone = isMultiComplete(multiSolve);
  const roundSize = multiSolveTotal(multiSolve.events);
  const multiMode = isLiveMultiMode(session, multiSolve);
  const currentCube = multiSolveEventAt(
    multiSolve.events,
    multiSolve.index,
  );
  const cubeProgress =
    multiMode && !multiDone
      ? `${multiSolve.index + 1}/${roundSize} · ${eventLabel(currentCube)}`
      : null;

  const roundTotal = useMemo(
    () => (multiDone ? roundTotalMs(solves, roundSize) : null),
    [multiDone, roundSize, solves],
  );

  const scale = settings.timerFontScale;

  const centerText = multiDone
    ? roundTotal == null
      ? 'DNF'
      : formatMs(roundTotal)
    : timer.phase === 'running'
      ? formatMs(runningElapsedMs)
      : timer.phase === 'inspecting' || timer.phase === 'armedToStart'
        ? Math.max(0, Math.ceil(inspectionRemainingMs / 1000)).toString()
        : '0.00';

  const subText = multiDone
    ? `ROUND TIME · ${roundSize} cube${roundSize === 1 ? '' : 's'}`
    : timer.phase === 'running' && multiMode
      ? cubeProgress ?? ''
      : timer.phase === 'inspecting' || timer.phase === 'armedToStart'
        ? inspectionPenalty === 'OK'
          ? `INSPECTION · ${inspectionLimitSec}s`
          : inspectionPenalty
        : session
          ? `${session.event} • ${session.solves.length} solves`
          : '';

  const tint = multiDone
    ? roundTotal == null
      ? 'text-bad'
      : 'text-white'
    : timer.phase === 'running'
        ? 'text-white'
        : inspectionPenalty === 'DNF'
          ? 'text-bad'
          : inspectionPenalty === '+2'
            ? 'text-warn'
            : 'text-white/90';

  const hintText = inRace
    ? racePhase === 'countdown'
      ? 'Get ready…'
      : timer.phase === 'running'
        ? 'Press Space or tap to finish the race'
        : 'Press Space or tap to start the race'
    : multiDone
    ? 'Press Space or tap to start the next round'
    : timer.phase === 'running'
      ? multiMode
        ? 'Press Space or tap to finish this cube'
        : 'Press Space or tap to stop'
      : timer.phase === 'inspecting' || timer.phase === 'armedToStart'
        ? 'Press Space or tap to start the solve'
        : 'Press Space or tap to start';

  return (
    <div
      className="grid h-[min(52vh,520px)] min-h-[340px] cursor-pointer place-items-center px-4 py-8 touch-manipulation select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      onClick={onTimerClick}
      onTouchStart={onTimerTouchStart}
      role="button"
      tabIndex={-1}
      aria-label="Timer — press Space or tap to start and stop"
    >
      <div className="pointer-events-none text-center">
        <div
          className={`font-semibold tracking-tight ${tint}`}
          style={{
            fontSize: `${clamp(92 * scale, 64, 140)}px`,
            lineHeight: 1.0,
          }}
        >
          {centerText}
        </div>
        <div className="mt-3 text-xs font-semibold tracking-[0.24em] text-white/60">
          {subText}
        </div>
        <div className="mt-6 text-sm text-white/50">{hintText}</div>
        {lastEarned && lastEarned.breakdown.totalXp > 0 && (
          <div
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-purple/25 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/80"
            title={
              `XP Earned: ${lastEarned.breakdown.totalXp}\n` +
              `Base XP: ${lastEarned.breakdown.baseXp}\n` +
              `Discipline Bonus: ${lastEarned.breakdown.disciplineBonusXp}\n` +
              `PB Bonus: ${lastEarned.breakdown.pbBonusXp}\n` +
              `Streak Bonus: ${lastEarned.breakdown.streakBonusXp}\n` +
              `Multi Bonus: ${lastEarned.breakdown.multiBonusXp}`
            }
          >
            +{lastEarned.breakdown.totalXp} XP
          </div>
        )}
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
