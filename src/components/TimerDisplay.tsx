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

export function TimerDisplay() {
  const timer = useAppStore((s) => s.timer);
  const settings = useAppStore((s) => s.settings);
  const multiSolve = useAppStore((s) => s.multiSolve);
  const solves = useAppStore(
    (s) => s.sessions.find((x) => x.id === s.currentSessionId)?.solves ?? [],
  );
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );

  const {
    inspectionRemainingMs,
    inspectionPenalty,
    runningElapsedMs,
    inspectionLimitSec,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
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
    : timer.phase === 'armed' || timer.phase === 'armedToStart'
      ? 'text-stat-green'
      : timer.phase === 'running'
        ? 'text-white'
        : inspectionPenalty === 'DNF'
          ? 'text-bad'
          : inspectionPenalty === '+2'
            ? 'text-warn'
            : 'text-white/90';

  const hintText = multiDone
    ? 'Press a key or click here to start the next round'
    : timer.phase === 'running' && multiMode
      ? 'Press Space or click to finish this cube · Esc to cancel'
      : timer.phase === 'inspecting' || timer.phase === 'armedToStart'
        ? 'Press Esc to cancel inspection'
        : 'Press Esc to cancel · Hold a key or click here, release to start';

  return (
    <div
      className="grid h-full min-h-[280px] cursor-pointer place-items-center px-4 py-10 touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      role="button"
      tabIndex={-1}
      aria-label="Timer — click and hold to start and stop"
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
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
