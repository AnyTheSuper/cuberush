import { create } from 'zustand';
import type {
  CubeEvent,
  Discipline,
  MultiSolvePlan,
  Session,
  Settings,
  Solve,
  SolvePenalty,
  TimerState,
} from '../types';
import { inferMultiRoundEvents, multiSolveEventAt } from '../lib/events';
import { generateScramble } from '../lib/scramble';

const LS_KEY = 'cube-timer:v1';

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function defaultSettings(): Settings {
  return {
    inspectionEnabled: true,
    inspectionSeconds: 15,
    inspectionBonusPerCubeSeconds: 2,
    soundEnabled: false,
    timerFontScale: 1.0,
    accent: 'blue',
  };
}

function normalizeSettings(settings: Settings): Settings {
  const d = defaultSettings();
  return {
    ...d,
    ...settings,
    inspectionSeconds:
      Number.isFinite(settings.inspectionSeconds) && settings.inspectionSeconds >= 0
        ? settings.inspectionSeconds
        : d.inspectionSeconds,
    inspectionBonusPerCubeSeconds:
      Number.isFinite(settings.inspectionBonusPerCubeSeconds) &&
      settings.inspectionBonusPerCubeSeconds >= 0
        ? settings.inspectionBonusPerCubeSeconds
        : d.inspectionBonusPerCubeSeconds,
  };
}

function makeSession(name: string, event: CubeEvent): Session {
  return {
    id: uid(),
    name,
    createdAt: Date.now(),
    event,
    discipline: 'standard',
    solves: [],
  };
}

function defaultTimerState(): TimerState {
  return {
    phase: 'idle',
    armedAt: null,
    inspectionStartedAt: null,
    runningStartedAt: null,
    nowMs: performance.now(),
  };
}

type Persisted = {
  sessions: Session[];
  currentSessionId: string;
  settings: Settings;
  multiSolve: MultiSolvePlan;
  scrambleByEvent: Record<CubeEvent, string>;
};

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

function savePersisted(p: Persisted) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

type AppState = Persisted & {
  timer: TimerState;
  lastSolveId: string | null;

  setNowMs: (nowMs: number) => void;
  setEvent: (event: CubeEvent) => void;
  setDiscipline: (discipline: Discipline) => void;
  nextScramble: () => void;

  setSettings: (patch: Partial<Settings>) => void;

  createSession: (name?: string) => void;
  switchSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  deleteSession: (id: string) => void;

  toggleMultiSolveEvent: (event: CubeEvent) => void;
  resetMultiSolve: () => void;
  advanceMultiSolve: () => void;

  timerSetPhase: (
    phase: TimerState['phase'],
    patch?: Partial<TimerState>,
  ) => void;
  addSolve: (input: {
    startedAt: number;
    endedAt: number;
    elapsedMs: number;
    penalty: SolvePenalty;
  }) => void;
  deleteSolve: (solveId: string) => void;
  deleteSolves: (solveIds: string[]) => void;
};

function normalizeSession(session: Session): Session {
  let next = session;
  if ((next.discipline as string) === 'fmc') {
    next = { ...next, discipline: 'standard' };
  }
  if (next.multiRoundEvents && next.multiRoundEvents.length > 1) {
    return next;
  }
  const inferred = inferMultiRoundEvents(next.solves);
  if (inferred) return { ...next, multiRoundEvents: inferred };
  return next;
}

function normalizeSessions(sessions: Session[]) {
  return sessions.map(normalizeSession);
}

function normalizeMultiSolve(
  multi: MultiSolvePlan | { index: number; events?: CubeEvent[]; total?: number },
  fallbackEvent: CubeEvent,
): MultiSolvePlan {
  const events =
    multi.events && multi.events.length > 0 ? [...multi.events] : [fallbackEvent];
  const index = Math.max(0, multi.index);
  return { index, events };
}

function syncSessionToEvent(
  st: Persisted,
  sessionId: string,
  event: CubeEvent,
  freshScramble = false,
) {
  const sessions = st.sessions.map((s) =>
    s.id === sessionId ? { ...s, event } : s,
  );
  const scrambleByEvent = {
    ...st.scrambleByEvent,
    [event]: freshScramble
      ? generateScramble(event)
      : (st.scrambleByEvent[event] ?? generateScramble(event)),
  };
  return { sessions, scrambleByEvent };
}

function initialPersisted(): Persisted {
  const base = loadPersisted();
  if (base && base.sessions?.length) {
    const sessions = normalizeSessions(base.sessions);
    const cur = sessions.find((s) => s.id === base.currentSessionId);
    const fallback = cur?.event ?? '333';
    const multiSolve = normalizeMultiSolve(base.multiSolve, fallback);
    const active = multiSolveEventAt(multiSolve.events, multiSolve.index);
    const synced = syncSessionToEvent(
      { ...base, sessions },
      base.currentSessionId,
      active,
    );
    return {
      ...base,
      settings: normalizeSettings(base.settings),
      multiSolve,
      ...synced,
    };
  }

  const s = makeSession('Session 1', '333');
  return {
    sessions: [s],
    currentSessionId: s.id,
    settings: defaultSettings(),
    multiSolve: { index: 0, events: ['333'] },
    scrambleByEvent: {
      '222': generateScramble('222'),
      '333': generateScramble('333'),
      '444': generateScramble('444'),
      '555': generateScramble('555'),
      '666': generateScramble('666'),
      '777': generateScramble('777'),
      '888': generateScramble('888'),
      '999': generateScramble('999'),
      '1010': generateScramble('1010'),
      '1111': generateScramble('1111'),
      '1212': generateScramble('1212'),
      '1313': generateScramble('1313'),
      '1414': generateScramble('1414'),
      '1515': generateScramble('1515'),
      '1616': generateScramble('1616'),
      '1717': generateScramble('1717'),
      '1818': generateScramble('1818'),
      '1919': generateScramble('1919'),
      pyra: generateScramble('pyra'),
      mega: generateScramble('mega'),
      kilo: generateScramble('kilo'),
      sq1: generateScramble('sq1'),
      clock: generateScramble('clock'),
      skewb: generateScramble('skewb'),
      mirror: generateScramble('mirror'),
      gear: generateScramble('gear'),
      ivy: generateScramble('ivy'),
      fisher: generateScramble('fisher'),
      windmill: generateScramble('windmill'),
      redi: generateScramble('redi'),
      dino: generateScramble('dino'),
      axis: generateScramble('axis'),
      cuboid_3x3x1: generateScramble('cuboid_3x3x1'),
      cuboid_3x3x2: generateScramble('cuboid_3x3x2'),
      cuboid_2x2x3: generateScramble('cuboid_2x2x3'),
      cuboid_1x2x3: generateScramble('cuboid_1x2x3'),
      special: generateScramble('special'),
    },
  };
}

export const useAppStore = create<AppState>((set, get) => {
  const persisted = initialPersisted();

  const persistNow = () => {
    const { sessions, currentSessionId, settings, multiSolve, scrambleByEvent } =
      get();
    savePersisted({
      sessions,
      currentSessionId,
      settings,
      multiSolve,
      scrambleByEvent,
    });
  };

  return {
    ...persisted,
    timer: defaultTimerState(),
    lastSolveId: null,

    setNowMs: (nowMs) => set((st) => ({ timer: { ...st.timer, nowMs } })),

    setEvent: (event) =>
      set((st) => {
        const synced = syncSessionToEvent(st, st.currentSessionId, event);
        const multiSolve =
          st.multiSolve.events.length <= 1
            ? { ...st.multiSolve, events: [event] }
            : st.multiSolve;
        queueMicrotask(persistNow);
        return { ...synced, multiSolve };
      }),

    setDiscipline: (discipline) =>
      set((st) => {
        const sessions = st.sessions.map((s) =>
          s.id === st.currentSessionId ? { ...s, discipline } : s,
        );
        queueMicrotask(persistNow);
        return { sessions };
      }),

    nextScramble: () =>
      set((st) => {
        const event = st.sessions.find((s) => s.id === st.currentSessionId)
          ?.event ?? '333';
        const scrambleByEvent = {
          ...st.scrambleByEvent,
          [event]: generateScramble(event),
        };
        queueMicrotask(persistNow);
        return { scrambleByEvent };
      }),

    setSettings: (patch) =>
      set((st) => {
        const settings = normalizeSettings({ ...st.settings, ...patch });
        queueMicrotask(persistNow);
        return { settings };
      }),

    createSession: (name) =>
      set((st) => {
        const idx = st.sessions.length + 1;
        const cur = st.sessions.find((s) => s.id === st.currentSessionId);
        const newS = makeSession(name ?? `Session ${idx}`, cur?.event ?? '333');
        const sessions = [newS, ...st.sessions];
        queueMicrotask(persistNow);
        return { sessions, currentSessionId: newS.id, multiSolve: { ...st.multiSolve, index: 0 } };
      }),

    switchSession: (id) =>
      set(() => {
        queueMicrotask(persistNow);
        return { currentSessionId: id, multiSolve: { ...get().multiSolve, index: 0 } };
      }),

    renameSession: (id, name) =>
      set((st) => {
        const sessions = st.sessions.map((s) => (s.id === id ? { ...s, name } : s));
        queueMicrotask(persistNow);
        return { sessions };
      }),

    deleteSession: (id) =>
      set((st) => {
        if (st.sessions.length <= 1) return {};
        const sessions = st.sessions.filter((s) => s.id !== id);
        const currentSessionId =
          st.currentSessionId === id
            ? (sessions[0]?.id ?? st.currentSessionId)
            : st.currentSessionId;
        queueMicrotask(persistNow);
        return { sessions, currentSessionId };
      }),

    toggleMultiSolveEvent: (event) =>
      set((st) => {
        let events = [...st.multiSolve.events];
        if (events.includes(event)) {
          if (events.length <= 1) return {};
          events = events.filter((e) => e !== event);
        } else {
          events.push(event);
        }
        const wasComplete = st.multiSolve.index >= st.multiSolve.events.length;
        const index = wasComplete
          ? 0
          : Math.min(st.multiSolve.index, events.length - 1);
        const multiSolve = { ...st.multiSolve, events, index };
        const active = multiSolveEventAt(events, index);
        const synced = syncSessionToEvent(st, st.currentSessionId, active);
        const sessions = synced.sessions.map((s) =>
          s.id === st.currentSessionId && events.length > 1
            ? { ...s, multiRoundEvents: [...events] }
            : s,
        );
        queueMicrotask(persistNow);
        return { multiSolve, ...synced, sessions };
      }),

    resetMultiSolve: () =>
      set((st) => {
        const multiSolve = { ...st.multiSolve, index: 0 };
        const active = multiSolveEventAt(multiSolve.events, 0);
        const synced = syncSessionToEvent(st, st.currentSessionId, active, true);
        queueMicrotask(persistNow);
        return { multiSolve, ...synced };
      }),

    advanceMultiSolve: () =>
      set((st) => {
        const { events, index } = st.multiSolve;
        const nextIdx = index + 1;
        if (nextIdx >= events.length) {
          const multiSolve = { ...st.multiSolve, index: events.length };
          queueMicrotask(persistNow);
          return { multiSolve };
        }
        const multiSolve = { ...st.multiSolve, index: nextIdx };
        const active = multiSolveEventAt(events, nextIdx);
        const synced = syncSessionToEvent(
          { ...st, multiSolve },
          st.currentSessionId,
          active,
          true,
        );
        queueMicrotask(persistNow);
        return { multiSolve, ...synced };
      }),

    timerSetPhase: (phase, patch) =>
      set((st) => ({
        timer: { ...st.timer, phase, ...patch },
      })),

    addSolve: ({ startedAt, endedAt, elapsedMs, penalty }) =>
      set((st) => {
        const session = st.sessions.find((s) => s.id === st.currentSessionId);
        if (!session) return {};
        const event = session.event;
        const scramble = st.scrambleByEvent[event] ?? generateScramble(event);
        const solve: Solve = {
          id: uid(),
          startedAt,
          endedAt,
          elapsedMs,
          penalty,
          scramble,
          event,
        };
        const sessions = st.sessions.map((s) =>
          s.id === session.id ? { ...s, solves: [solve, ...s.solves] } : s,
        );
        queueMicrotask(persistNow);
        return { sessions, lastSolveId: solve.id };
      }),

    deleteSolve: (solveId) =>
      set((st) => {
        const ids = new Set([solveId]);
        const sessions = st.sessions.map((s) =>
          s.id === st.currentSessionId
            ? { ...s, solves: s.solves.filter((sol) => !ids.has(sol.id)) }
            : s,
        );
        const lastSolveId =
          st.lastSolveId === solveId
            ? (sessions.find((s) => s.id === st.currentSessionId)?.solves[0]
                ?.id ?? null)
            : st.lastSolveId;
        queueMicrotask(persistNow);
        return { sessions, lastSolveId };
      }),

    deleteSolves: (solveIds) =>
      set((st) => {
        const ids = new Set(solveIds);
        const sessions = st.sessions.map((s) =>
          s.id === st.currentSessionId
            ? { ...s, solves: s.solves.filter((sol) => !ids.has(sol.id)) }
            : s,
        );
        const lastSolveId =
          st.lastSolveId && ids.has(st.lastSolveId)
            ? (sessions.find((s) => s.id === st.currentSessionId)?.solves[0]
                ?.id ?? null)
            : st.lastSolveId;
        queueMicrotask(persistNow);
        return { sessions, lastSolveId };
      }),
  };
});

export function useCurrentSession() {
  return useAppStore((s) => s.sessions.find((x) => x.id === s.currentSessionId));
}

