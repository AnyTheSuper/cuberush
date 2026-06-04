import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { isMultiComplete, isLiveMultiMode } from '../lib/events';
import {
  getInspectionLimits,
  inspectionPenaltyFromElapsed,
} from '../lib/inspection';
import { useAppStore } from '../store/useAppStore';
import { useRaceStore } from '../store/useRaceStore';
import type { TimerPhase } from '../types';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function useTimerInput() {
  const timer = useAppStore((s) => s.timer);
  const timerSetPhase = useAppStore((s) => s.timerSetPhase);
  const addSolve = useAppStore((s) => s.addSolve);
  const advanceMultiSolve = useAppStore((s) => s.advanceMultiSolve);
  const resetMultiSolve = useAppStore((s) => s.resetMultiSolve);
  const setNowMs = useAppStore((s) => s.setNowMs);

  const solveStartedEpochRef = useRef<number | null>(null);
  const solveStartedPerfRef = useRef<number | null>(null);
  const pendingPenaltyRef = useRef<'OK' | '+2' | 'DNF'>('OK');
  const runGuardUntilRef = useRef(0);
  const lastActivateAtRef = useRef(0);
  const skipNextClickRef = useRef(false);
  const activateRef = useRef(() => {});

  const armRunGuard = () => {
    runGuardUntilRef.current = performance.now() + 500;
  };

  const canStopRunning = () => performance.now() >= runGuardUntilRef.current;

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNowMs(performance.now());
      raf = requestAnimationFrame(tick);
    };

    const needsLive =
      timer.phase === 'running' ||
      timer.phase === 'inspecting' ||
      timer.phase === 'armedToStart';
    if (needsLive) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setNowMs, timer.phase]);

  useEffect(() => {
    const cancelActiveTimer = () => {
      pendingPenaltyRef.current = 'OK';
      solveStartedEpochRef.current = null;
      solveStartedPerfRef.current = null;
      timerSetPhase('idle', {
        armedAt: null,
        inspectionStartedAt: null,
        runningStartedAt: null,
      });
    };

    const onEscape = (e: KeyboardEvent) => {
      if (e.code !== 'Escape' && e.key !== 'Escape') return;
      if (document.querySelector('[data-modal-overlay]')) return;

      const st = useAppStore.getState();
      const phase = st.timer.phase;
      if (phase === 'idle') return;

      e.preventDefault();
      e.stopPropagation();

      const session = st.sessions.find((x) => x.id === st.currentSessionId);
      const multiMode = isLiveMultiMode(session, st.multiSolve);
      if (multiMode) {
        // Esc cancels the whole multi attempt, not just the current cube.
        resetMultiSolve();
      }
      cancelActiveTimer();
    };

    window.addEventListener('keydown', onEscape, { capture: true });
    return () => window.removeEventListener('keydown', onEscape, { capture: true });
  }, [resetMultiSolve, timerSetPhase]);

  useEffect(() => {
    const prepareRound = () => {
      const st = useAppStore.getState();
      if (isMultiComplete(st.multiSolve)) {
        resetMultiSolve();
      }
    };

    const beginRunning = (now: number) => {
      pendingPenaltyRef.current = 'OK';
      solveStartedEpochRef.current = Date.now();
      solveStartedPerfRef.current = now;
      armRunGuard();
      timerSetPhase('running', {
        runningStartedAt: now,
        armedAt: null,
        inspectionStartedAt: null,
      });
    };

    const beginRunningAfterInspection = (now: number) => {
      const st = useAppStore.getState();
      const inspStart = st.timer.inspectionStartedAt ?? now;
      const inspElapsed = now - inspStart;
      const limits = getInspectionLimits(st.settings, st.multiSolve.events.length);
      pendingPenaltyRef.current = inspectionPenaltyFromElapsed(
        inspElapsed,
        limits,
      );
      solveStartedEpochRef.current = Date.now();
      solveStartedPerfRef.current = now;
      armRunGuard();
      timerSetPhase('running', {
        runningStartedAt: now,
        armedAt: null,
        inspectionStartedAt: null,
      });
    };

    const finishSolve = (now: number) => {
      const st = useAppStore.getState();
      const startedPerf = solveStartedPerfRef.current;
      const startedEpoch = solveStartedEpochRef.current;
      if (startedPerf == null || startedEpoch == null) return;

      const racePhase = useRaceStore.getState().phase;
      if (racePhase === 'racing') {
        useRaceStore.getState().submitPlayerSolve(
          Math.max(0, now - startedPerf),
          pendingPenaltyRef.current,
        );
        pendingPenaltyRef.current = 'OK';
        solveStartedEpochRef.current = null;
        solveStartedPerfRef.current = null;
        timerSetPhase('idle', {
          armedAt: null,
          inspectionStartedAt: null,
          runningStartedAt: null,
        });
        return;
      }

      const session = st.sessions.find((x) => x.id === st.currentSessionId);
      const multiMode = isLiveMultiMode(session, st.multiSolve);
      const roundStartedAt = st.timer.runningStartedAt;

      addSolve({
        startedAt: startedEpoch,
        endedAt: Date.now(),
        elapsedMs: Math.max(0, now - startedPerf),
        penalty: pendingPenaltyRef.current,
      });
      advanceMultiSolve();

      const after = useAppStore.getState();
      const roundDone = isMultiComplete(after.multiSolve);

      if (multiMode && !roundDone && roundStartedAt != null) {
        pendingPenaltyRef.current = 'OK';
        solveStartedEpochRef.current = Date.now();
        solveStartedPerfRef.current = now;
        armRunGuard();
        timerSetPhase('running', {
          runningStartedAt: roundStartedAt,
          armedAt: null,
          inspectionStartedAt: null,
        });
        return;
      }

      pendingPenaltyRef.current = 'OK';
      solveStartedEpochRef.current = null;
      solveStartedPerfRef.current = null;
      timerSetPhase('idle', {
        armedAt: null,
        inspectionStartedAt: null,
        runningStartedAt: null,
      });
    };

    /** One press / one tap advances: idle → inspection → solve → stop */
    const onActivate = () => {
      const now = performance.now();
      if (now - lastActivateAtRef.current < 280) return;
      lastActivateAtRef.current = now;

      const racePhase = useRaceStore.getState().phase;
      if (racePhase === 'searching' || racePhase === 'ready' || racePhase === 'results') {
        return;
      }
      if (racePhase === 'countdown') {
        return;
      }

      prepareRound();

      const st = useAppStore.getState();
      const phase: TimerPhase = st.timer.phase;

      if (phase === 'idle' || phase === 'armed' || phase === 'armedToStart') {
        if (st.settings.inspectionEnabled) {
          pendingPenaltyRef.current = 'OK';
          timerSetPhase('inspecting', {
            inspectionStartedAt: now,
            armedAt: null,
          });
        } else {
          beginRunning(now);
        }
        return;
      }

      if (phase === 'inspecting') {
        beginRunningAfterInspection(now);
        return;
      }

      if (phase === 'running') {
        if (!canStopRunning()) return;
        finishSolve(now);
      }
    };

    activateRef.current = onActivate;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.repeat) return;
      onActivate();
    };

    window.addEventListener('keydown', onKeyDown, { capture: true, passive: false });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [addSolve, advanceMultiSolve, resetMultiSolve, timerSetPhase]);

  const derived = useMemo(() => {
    const st = useAppStore.getState();
    const now = timer.nowMs;
    const inspStart = timer.inspectionStartedAt;
    const runStart = timer.runningStartedAt;
    const cubeCount = st.multiSolve.events.length;
    const limits = getInspectionLimits(st.settings, cubeCount);

    const inspectionElapsed = inspStart == null ? 0 : Math.max(0, now - inspStart);
    const inspectionRemainingMs = limits.limitMs - inspectionElapsed;
    const inspectionPenalty = inspectionPenaltyFromElapsed(
      inspectionElapsed,
      limits,
    );

    const runningElapsedMs = runStart == null ? 0 : Math.max(0, now - runStart);

    return {
      inspectionRemainingMs,
      inspectionPenalty,
      runningElapsedMs,
      inspectionLimitSec: limits.limitMs / 1000,
    };
  }, [timer.inspectionStartedAt, timer.nowMs, timer.runningStartedAt]);

  const onTimerTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    skipNextClickRef.current = true;
    activateRef.current();
  }, []);

  const onTimerClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (skipNextClickRef.current) {
      skipNextClickRef.current = false;
      return;
    }
    activateRef.current();
  }, []);

  return {
    ...derived,
    onTimerClick,
    onTimerTouchStart,
  };
}

/** @deprecated use useTimerInput */
export const useKeyboardTimer = useTimerInput;
