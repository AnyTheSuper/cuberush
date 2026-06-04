import { create } from 'zustand';
import { simulateAiSolveMs } from '../lib/race/aiOpponents';
import { applyRaceResult } from '../lib/race/career';
import { findMatch } from '../lib/race/matchmakingService';
import type {
  RaceCareerProfile,
  RaceFlowPhase,
  RaceHistoryEntry,
  RaceMatch,
  RaceOutcome,
} from '../lib/race/types';
import { defaultRaceCareer } from '../lib/race/types';
import type { CubeEvent, SolvePenalty } from '../types';
import { useAppStore } from './useAppStore';
import { useAuthStore } from './useAuthStore';

type RaceState = {
  phase: RaceFlowPhase;
  match: RaceMatch | null;
  searchStartedAt: number | null;
  countdown: number | null;
  opponentSolveMs: number | null;
  raceStartedAt: number | null;
  opponentFinished: boolean;
  playerFinished: boolean;
  lastOutcome: RaceOutcome | null;
  lastEntry: RaceHistoryEntry | null;
  cancelSearch: () => void;
  enterQueue: (event: CubeEvent) => void;
  beginCountdown: () => void;
  tickCountdown: () => void;
  startRacing: () => void;
  submitPlayerSolve: (elapsedMs: number, penalty: SolvePenalty) => void;
  tickOpponent: (nowMs: number) => void;
  leaveRace: () => void;
  getCareer: () => RaceCareerProfile;
};

let searchAbort = false;
let opponentFinishAt: number | null = null;

export const useRaceStore = create<RaceState>((set, get) => ({
  phase: 'idle',
  match: null,
  searchStartedAt: null,
  countdown: null,
  opponentSolveMs: null,
  raceStartedAt: null,
  opponentFinished: false,
  playerFinished: false,
  lastOutcome: null,
  lastEntry: null,

  getCareer: () => {
    const career = useAppStore.getState().raceCareer;
    return career?.version === 1 ? career : defaultRaceCareer();
  },

  cancelSearch: () => {
    searchAbort = true;
    set({
      phase: 'idle',
      match: null,
      searchStartedAt: null,
    });
  },

  enterQueue: (event) => {
    searchAbort = false;
    set({
      phase: 'searching',
      match: null,
      searchStartedAt: Date.now(),
      countdown: null,
      opponentSolveMs: null,
      raceStartedAt: null,
      opponentFinished: false,
      playerFinished: false,
      lastOutcome: null,
      lastEntry: null,
    });

    const career = get().getCareer();
    const auth = useAuthStore.getState();
    const account = auth.getCurrentAccount();

    void findMatch({
      userId: auth.userId,
      displayName: account?.username ?? 'Player',
      rating: career.rating,
      event,
    }).then((match) => {
      if (searchAbort) return;
      set({
        phase: 'ready',
        match,
        opponentSolveMs: simulateAiSolveMs(match.opponent.rating, match.event),
      });
    });
  },

  beginCountdown: () => {
    set({ phase: 'countdown', countdown: 3 });
  },

  tickCountdown: () => {
    const c = get().countdown;
    if (c == null) return;
    if (c <= 1) {
      get().startRacing();
      return;
    }
    set({ countdown: c - 1 });
  },

  startRacing: () => {
    const oppMs = get().opponentSolveMs ?? 12_000;
    const started = performance.now();
    opponentFinishAt = started + oppMs;
    set({
      phase: 'racing',
      countdown: null,
      raceStartedAt: started,
      opponentFinished: false,
      playerFinished: false,
    });
    useAppStore.getState().timerSetPhase('idle', {
      armedAt: null,
      inspectionStartedAt: null,
      runningStartedAt: null,
    });
  },

  tickOpponent: (nowMs) => {
    if (get().phase !== 'racing') return;
    if (get().opponentFinished) return;
    if (opponentFinishAt == null) return;
    if (nowMs >= opponentFinishAt) {
      set({ opponentFinished: true });
    }
  },

  submitPlayerSolve: (elapsedMs, penalty) => {
    const { match, opponentSolveMs, phase } = get();
    if (!match || phase !== 'racing' || get().playerFinished) return;

    const opponentMs =
      penalty === 'DNF' && !get().opponentFinished
        ? opponentSolveMs
        : opponentSolveMs;

    const { career, outcome, entry } = applyRaceResult(get().getCareer(), {
      event: match.event,
      opponentUsername: match.opponent.username,
      playerElapsedMs: elapsedMs,
      playerPenalty: penalty,
      opponentMs: get().opponentFinished ? opponentMs : opponentMs,
    });

    useAppStore.getState().setRaceCareer(career);

    set({
      phase: 'results',
      playerFinished: true,
      opponentFinished: true,
      lastOutcome: outcome,
      lastEntry: entry,
    });

    useAppStore.getState().timerSetPhase('idle', {
      armedAt: null,
      inspectionStartedAt: null,
      runningStartedAt: null,
    });
  },

  leaveRace: () => {
    searchAbort = true;
    opponentFinishAt = null;
    set({
      phase: 'idle',
      match: null,
      searchStartedAt: null,
      countdown: null,
      opponentSolveMs: null,
      raceStartedAt: null,
      opponentFinished: false,
      playerFinished: false,
      lastOutcome: null,
      lastEntry: null,
    });
  },
}));

export function isRaceActive() {
  const p = useRaceStore.getState().phase;
  return p === 'searching' || p === 'ready' || p === 'countdown' || p === 'racing' || p === 'results';
}
