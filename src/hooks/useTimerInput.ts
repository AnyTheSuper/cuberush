import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isMultiComplete, isLiveMultiMode } from '../lib/events';
import {
  getInspectionLimits,
  inspectionPenaltyFromElapsed,
} from '../lib/inspection';
import { useAppStore } from '../store/useAppStore';
import type { SolvePenalty, TimerPhase } from '../types';

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

  const inputHeldRef = useRef(false);
  const solveStartedEpochRef = useRef<number | null>(null);
  const solveStartedPerfRef = useRef<number | null>(null);
  const pendingPenaltyRef = useRef<SolvePenalty>('OK');
  const touchActiveRef = useRef(false);
  const inspectionReadyHeldRef = useRef(false);
  const inspectionReadySinceRef = useRef(0);
  /** Ignore stop / duplicate press briefly after the solve timer starts. */
  const runGuardUntilRef = useRef(0);
  const [inspectionReadyHeld, setInspectionReadyHeld] = useState(false);
  const surfaceCleanupRef = useRef<(() => void) | null>(null);

  const armRunGuard = () => {
    runGuardUntilRef.current = performance.now() + 600;
  };

  const canStopRunning = () => performance.now() >= runGuardUntilRef.current;
  const handlersRef = useRef({
    onPressDown: () => {},
    onPressUp: () => {},
    cancelActiveTimer: () => {},
  });

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
      inputHeldRef.current = false;
      touchActiveRef.current = false;
      inspectionReadyHeldRef.current = false;
      setInspectionReadyHeld(false);
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

      const phase = useAppStore.getState().timer.phase;
      if (phase === 'idle') return;

      e.preventDefault();
      e.stopPropagation();
      cancelActiveTimer();
    };

    window.addEventListener('keydown', onEscape, { capture: true });
    return () => window.removeEventListener('keydown', onEscape, { capture: true });
  }, [timerSetPhase]);

  useEffect(() => {
    const releaseInput = () => {
      inputHeldRef.current = false;
      touchActiveRef.current = false;
      inspectionReadyHeldRef.current = false;
      setInspectionReadyHeld(false);
    };

    const cancelActiveTimer = () => {
      releaseInput();
      pendingPenaltyRef.current = 'OK';
      solveStartedEpochRef.current = null;
      solveStartedPerfRef.current = null;
      timerSetPhase('idle', {
        armedAt: null,
        inspectionStartedAt: null,
        runningStartedAt: null,
      });
    };

    const prepareRound = () => {
      const st = useAppStore.getState();
      if (isMultiComplete(st.multiSolve)) {
        resetMultiSolve();
      }
    };

    const onPressDown = () => {
      if (inputHeldRef.current) return;
      inputHeldRef.current = true;

      prepareRound();

      const st = useAppStore.getState();
      const phase: TimerPhase = st.timer.phase;
      const now = performance.now();

      if (phase === 'idle') {
        timerSetPhase('armed', { armedAt: now });
        return;
      }

      if (phase === 'inspecting') {
        inspectionReadyHeldRef.current = true;
        inspectionReadySinceRef.current = performance.now();
        setInspectionReadyHeld(true);
        return;
      }

      if (phase === 'running') {
        if (!canStopRunning()) return;

        const startedPerf = solveStartedPerfRef.current;
        const startedEpoch = solveStartedEpochRef.current;
        if (startedPerf == null || startedEpoch == null) return;

        const endedEpoch = Date.now();
        const elapsedMs = Math.max(0, now - startedPerf);
        const penalty = pendingPenaltyRef.current;
        const session = st.sessions.find((x) => x.id === st.currentSessionId);
        const multiMode = isLiveMultiMode(session, st.multiSolve);
        const roundStartedAt = st.timer.runningStartedAt;

        addSolve({
          startedAt: startedEpoch,
          endedAt: endedEpoch,
          elapsedMs,
          penalty,
        });
        advanceMultiSolve();

        const after = useAppStore.getState();
        const roundDone = isMultiComplete(after.multiSolve);

        releaseInput();

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
      }
    };

    const onPressUp = () => {
      if (!inputHeldRef.current) return;
      inputHeldRef.current = false;
      touchActiveRef.current = false;

      prepareRound();

      const st = useAppStore.getState();
      const phase: TimerPhase = st.timer.phase;
      const now = performance.now();
      const cubeCount = st.multiSolve.events.length;
      const limits = getInspectionLimits(st.settings, cubeCount);

      if (phase === 'armed') {
        if (st.settings.inspectionEnabled) {
          pendingPenaltyRef.current = 'OK';
          timerSetPhase('inspecting', {
            inspectionStartedAt: now,
            armedAt: null,
          });
          return;
        }

        pendingPenaltyRef.current = 'OK';
        solveStartedEpochRef.current = Date.now();
        solveStartedPerfRef.current = now;
        armRunGuard();
        timerSetPhase('running', {
          runningStartedAt: now,
          armedAt: null,
          inspectionStartedAt: null,
        });
        return;
      }

      if (phase === 'inspecting' && inspectionReadyHeldRef.current) {
        const heldMs = performance.now() - inspectionReadySinceRef.current;
        inspectionReadyHeldRef.current = false;
        setInspectionReadyHeld(false);

        if (heldMs < 120) {
          return;
        }

        const inspStart = st.timer.inspectionStartedAt ?? now;
        const inspElapsed = now - inspStart;
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
        return;
      }

      if (phase === 'armedToStart') {
        const inspStart = st.timer.inspectionStartedAt ?? now;
        const inspElapsed = now - inspStart;
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
      }
    };

    handlersRef.current = { onPressDown, onPressUp, cancelActiveTimer };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      if (e.repeat) return;

      onPressDown();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      if (e.repeat) return;

      onPressUp();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [addSolve, advanceMultiSolve, resetMultiSolve, timerSetPhase]);

  const surfaceRef = useCallback((node: HTMLDivElement | null) => {
    surfaceCleanupRef.current?.();
    surfaceCleanupRef.current = null;

    if (!node) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      e.preventDefault();

      const phase = useAppStore.getState().timer.phase;

      if (phase === 'running') {
        touchActiveRef.current = true;
        handlersRef.current.onPressDown();
        return;
      }

      if (touchActiveRef.current) return;
      touchActiveRef.current = true;
      handlersRef.current.onPressDown();
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();

      if (!touchActiveRef.current) return;
      touchActiveRef.current = false;
      handlersRef.current.onPressUp();
    };

    const onTouchCancel = () => {
      if (!touchActiveRef.current) return;
      touchActiveRef.current = false;
      inputHeldRef.current = false;
      if (inspectionReadyHeldRef.current) {
        inspectionReadyHeldRef.current = false;
        setInspectionReadyHeld(false);
      }
    };

    const opts: AddEventListenerOptions = { passive: false };
    node.addEventListener('touchstart', onTouchStart, opts);
    node.addEventListener('touchend', onTouchEnd, opts);
    node.addEventListener('touchcancel', onTouchCancel, opts);

    surfaceCleanupRef.current = () => {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);

  const derived = useMemo(() => {
    const st = useAppStore.getState();
    const now = timer.nowMs;
    const inspStart = timer.inspectionStartedAt;
    const runStart = timer.runningStartedAt;
    const cubeCount = st.multiSolve.events.length;
    const limits = getInspectionLimits(st.settings, cubeCount);

    const inspectionElapsed = inspStart == null ? 0 : Math.max(0, now - inspStart);
    const inspectionRemainingMs = limits.limitMs - inspectionElapsed;
    const inspectionPenalty: SolvePenalty = inspectionPenaltyFromElapsed(
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

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;
    e.preventDefault();
    handlersRef.current.onPressDown();
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    e.preventDefault();
    handlersRef.current.onPressUp();
  }, []);

  const onPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const phase = useAppStore.getState().timer.phase;
    if (phase === 'inspecting' && inspectionReadyHeldRef.current) {
      inspectionReadyHeldRef.current = false;
      setInspectionReadyHeld(false);
    }
    inputHeldRef.current = false;
  }, []);

  return {
    ...derived,
    inspectionReadyHeld,
    surfaceRef,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
  };
}

/** @deprecated use useTimerInput */
export const useKeyboardTimer = useTimerInput;
