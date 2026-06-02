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
  XpProfile,
} from '../types';
import {
  getSessionRoundConfig,
  inferMultiRoundEvents,
  multiSolveEventAt,
} from '../lib/events';
import {
  buildDefaultScrambleMap,
  generateScramble,
  generateScrambleSync,
  shouldAutoNextScramble,
} from '../lib/scramble';
import { appStorageKey, clearAllAppStorageBuckets } from '../lib/storage';
import { bestMs, roundTotalMs, solveToMs } from '../lib/stats';
import { groupIntoRounds } from '../lib/rounds';
import { xpForMultiCubeSolve, xpForMultiRoundBonus, xpForSingleSolve } from '../lib/xp/engine';
import { createEmptyXpProfile, pushTransaction, unlockAchievement } from '../lib/xp/profile';

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
    otherDisciplineMultiplier: 1.2,
    uiAdvancedOpen: false,
    defaultDiscipline: 'standard',
    defaultEvent: '333',
    defaultMultiEvents: ['333', '444', '555'],
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
    otherDisciplineMultiplier:
      Number.isFinite((settings as any).otherDisciplineMultiplier) &&
      (settings as any).otherDisciplineMultiplier > 0
        ? (settings as any).otherDisciplineMultiplier
        : d.otherDisciplineMultiplier,
    uiAdvancedOpen: Boolean((settings as any).uiAdvancedOpen),
    defaultDiscipline: (settings as any).defaultDiscipline ?? d.defaultDiscipline,
    defaultEvent: (settings as any).defaultEvent ?? d.defaultEvent,
    defaultMultiEvents:
      Array.isArray((settings as any).defaultMultiEvents) &&
      (settings as any).defaultMultiEvents.length > 0
        ? (settings as any).defaultMultiEvents
        : d.defaultMultiEvents,
  };
}

function setupKeyFor(input: {
  discipline: Discipline;
  event: CubeEvent;
  multiEvents?: CubeEvent[];
}) {
  if (input.discipline === 'multi') {
    const events = (input.multiEvents?.length ? input.multiEvents : [input.event]).join(',');
    return `multi:${events}`;
  }
  return `${input.discipline}:${input.event}`;
}

function setupNameFor(input: {
  discipline: Discipline;
  event: CubeEvent;
  multiEvents?: CubeEvent[];
}): string {
  const d = input.discipline;
  if (d === 'multi') {
    const n = input.multiEvents?.length ?? 1;
    return `Multi · ${n} cube${n === 1 ? '' : 's'}`;
  }
  const disciplineLabel =
    d === 'oneHanded'
      ? 'One-Handed'
      : d === 'standard'
        ? 'Standard'
        : d === 'blind'
          ? 'Blind'
          : d === 'feet'
            ? 'Feet'
            : d === 'other'
              ? 'Other'
              : d;
  return `${disciplineLabel} · ${input.event}`;
}

function makeSetupSession(input: {
  discipline: Discipline;
  event: CubeEvent;
  multiEvents?: CubeEvent[];
}): Session {
  const key = setupKeyFor(input);
  return {
    id: uid(),
    name: setupNameFor(input),
    createdAt: Date.now(),
    event: input.event,
    discipline: input.discipline,
    setupKey: key,
    multiRoundEvents:
      input.discipline === 'multi' && input.multiEvents && input.multiEvents.length > 1
        ? [...input.multiEvents]
        : undefined,
    solves: [],
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

/** Next default name "Session N" — smallest N not already used. */
function nextSessionName(sessions: Session[]): string {
  const used = new Set<number>();
  for (const s of sessions) {
    const m = /^Session\s+(\d+)$/i.exec(s.name.trim());
    if (m) used.add(Number(m[1]));
  }
  let n = 1;
  while (used.has(n)) n += 1;
  return `Session ${n}`;
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
  dataVersion?: number;
  sessions: Session[];
  currentSessionId: string;
  settings: Settings;
  multiSolve: MultiSolvePlan;
  scrambleByEvent: Record<CubeEvent, string>;
  xp: XpProfile;
};

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(appStorageKey());
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

function savePersisted(p: Persisted) {
  try {
    localStorage.setItem(appStorageKey(), JSON.stringify({ ...p, dataVersion: 2 }));
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

  resetAllData: () => void;
  rehydrateFromStorage: () => void;

  refreshOfficialScramble: (event: CubeEvent) => void;
  hydrateOfficialScrambles: () => void;
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
    [event]:
      freshScramble || !st.scrambleByEvent[event]
        ? generateScrambleSync(event)
        : st.scrambleByEvent[event],
  };
  return { sessions, scrambleByEvent };
}

function initialPersisted(): Persisted {
  const base = loadPersisted();
  // Legacy wipe requested: if stored data is from older versions, reset sessions to setup-driven model.
  if (base && (base as any).dataVersion !== 2) {
    const settings = base?.settings ? normalizeSettings(base.settings) : defaultSettings();
    const xp = (base as any).xp?.version === 1 ? (base as any).xp : createEmptyXpProfile();
    const discipline = settings.defaultDiscipline ?? 'standard';
    const event = settings.defaultEvent ?? '333';
    const multiEvents = settings.defaultMultiEvents ?? [event];
    const session = makeSetupSession({
      discipline,
      event,
      multiEvents: discipline === 'multi' ? multiEvents : undefined,
    });
    const multiSolve: MultiSolvePlan =
      discipline === 'multi'
        ? { index: 0, events: [...(multiEvents.length ? multiEvents : [event])] }
        : { index: 0, events: [event] };
    return {
      dataVersion: 2,
      sessions: [session],
      currentSessionId: session.id,
      settings,
      multiSolve,
      scrambleByEvent: buildDefaultScrambleMap(),
      xp,
    };
  }

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
      dataVersion: 2,
      settings: normalizeSettings(base.settings),
      multiSolve,
      ...synced,
      xp: (base as any).xp?.version === 1 ? (base as any).xp : createEmptyXpProfile(),
    };
  }

  const d = defaultSettings();
  const session = makeSetupSession({
    discipline: d.defaultDiscipline,
    event: d.defaultEvent,
    multiEvents: d.defaultDiscipline === 'multi' ? d.defaultMultiEvents : undefined,
  });
  return {
    dataVersion: 2,
    sessions: [session],
    currentSessionId: session.id,
    settings: d,
    multiSolve:
      d.defaultDiscipline === 'multi'
        ? { index: 0, events: [...d.defaultMultiEvents] }
        : { index: 0, events: [d.defaultEvent] },
    scrambleByEvent: buildDefaultScrambleMap(),
    xp: createEmptyXpProfile(),
  };
}

export const useAppStore = create<AppState>((set, get) => {
  const persisted = initialPersisted();
  let activeMultiRoundId: string | null = null;

  const ensureSetupSession = (input: {
    discipline: Discipline;
    event: CubeEvent;
    multiEvents?: CubeEvent[];
  }) => {
    const key = setupKeyFor(input);
    const st = get();
    const existing = st.sessions.find((s) => (s.setupKey ?? '') === key);
    if (existing) return existing;
    const created = makeSetupSession(input);
    set((prev) => ({ sessions: [created, ...prev.sessions] }));
    return created;
  };

  const persistNow = () => {
    const { sessions, currentSessionId, settings, multiSolve, scrambleByEvent, xp } =
      get();
    savePersisted({
      dataVersion: 2,
      sessions,
      currentSessionId,
      settings,
      multiSolve,
      scrambleByEvent,
      xp,
    });
  };

  return {
    ...persisted,
    timer: defaultTimerState(),
    lastSolveId: null,

    setNowMs: (nowMs) => set((st) => ({ timer: { ...st.timer, nowMs } })),

    setEvent: (event) => {
      // Setup-driven: changing cube switches to that Mode+Cube session.
      const st = get();
      const session = st.sessions.find((s) => s.id === st.currentSessionId);
      const discipline = session?.discipline ?? 'standard';

      if (discipline === 'multi') {
        // In multi mode, treat event as first cube in the list.
        const events =
          st.multiSolve.events.length > 0 ? [...st.multiSolve.events] : [event];
        if (events[0] !== event) events[0] = event;
        const nextSession = ensureSetupSession({
          discipline: 'multi',
          event,
          multiEvents: events,
        });
        set(() => ({
          currentSessionId: nextSession.id,
          multiSolve: { index: 0, events },
        }));
        queueMicrotask(persistNow);
        get().refreshOfficialScramble(event);
        return;
      }

      const nextSession = ensureSetupSession({ discipline, event });
      set(() => ({
        currentSessionId: nextSession.id,
        multiSolve: { index: 0, events: [event] },
        scrambleByEvent: {
          ...get().scrambleByEvent,
          [event]: generateScrambleSync(event),
        },
      }));
      queueMicrotask(persistNow);
      get().refreshOfficialScramble(event);
    },

    setDiscipline: (discipline) =>
      (() => {
        const st = get();
        const cur = st.sessions.find((s) => s.id === st.currentSessionId);
        const event = cur?.event ?? st.settings.defaultEvent ?? '333';

        if (discipline === 'multi') {
          const events =
            st.multiSolve.events.length > 1
              ? [...st.multiSolve.events]
              : [...(st.settings.defaultMultiEvents ?? [event])];
          const nextSession = ensureSetupSession({
            discipline: 'multi',
            event: events[0] ?? event,
            multiEvents: events,
          });
          set(() => ({
            currentSessionId: nextSession.id,
            multiSolve: { index: 0, events },
          }));
          queueMicrotask(persistNow);
          return;
        }

        const nextSession = ensureSetupSession({ discipline, event });
        set(() => ({
          currentSessionId: nextSession.id,
          multiSolve: { index: 0, events: [event] },
        }));
        queueMicrotask(persistNow);
      })(),

    nextScramble: () => {
      const event =
        get().sessions.find((s) => s.id === get().currentSessionId)?.event ??
        '333';
      set((st) => ({
        scrambleByEvent: {
          ...st.scrambleByEvent,
          [event]: generateScrambleSync(event),
        },
      }));
      get().refreshOfficialScramble(event);
    },

    setSettings: (patch) =>
      set((st) => {
        const settings = normalizeSettings({ ...st.settings, ...patch });
        queueMicrotask(persistNow);
        return { settings };
      }),

    createSession: (name) =>
      set((st) => {
        const cur = st.sessions.find((s) => s.id === st.currentSessionId);
        const newS = makeSession(
          name ?? nextSessionName(st.sessions),
          cur?.event ?? '333',
        );
        const sessions = [newS, ...st.sessions];
        queueMicrotask(persistNow);
        return { sessions, currentSessionId: newS.id, multiSolve: { ...st.multiSolve, index: 0 } };
      }),

    switchSession: (id) =>
      set((st) => {
        const target = st.sessions.find((s) => s.id === id);
        if (!target) return {};

        const isMulti = target.discipline === 'multi';
        const events =
          isMulti && target.multiRoundEvents && target.multiRoundEvents.length > 0
            ? [...target.multiRoundEvents]
            : [target.event];
        const multiSolve = { index: 0, events };
        const active = multiSolveEventAt(events, 0);
        const synced = syncSessionToEvent(st, id, active);

        queueMicrotask(persistNow);
        return { currentSessionId: id, multiSolve, ...synced };
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
        // Setup-driven: if current discipline is multi, the multi cube list defines the session.
        const cur = st.sessions.find((s) => s.id === st.currentSessionId);
        const discipline = cur?.discipline ?? 'standard';
        let sessions = st.sessions;
        let currentSessionId = st.currentSessionId;
        let scrambleByEvent = st.scrambleByEvent;

        if (discipline === 'multi') {
          const nextSession = ensureSetupSession({
            discipline: 'multi',
            event: active,
            multiEvents: events,
          });
          currentSessionId = nextSession.id;
          // Ensure the session remembers its round order.
          sessions = sessions.map((s) =>
            s.id === nextSession.id ? { ...s, multiRoundEvents: [...events] } : s,
          );
        } else {
          // Non-multi sessions: keep existing behavior for scramble event sync.
          const synced = syncSessionToEvent(st, st.currentSessionId, active);
          sessions = synced.sessions;
          scrambleByEvent = synced.scrambleByEvent;
        }

        queueMicrotask(persistNow);
        return { multiSolve, sessions, currentSessionId, scrambleByEvent };
      }),

    resetMultiSolve: () => {
      const active = multiSolveEventAt(get().multiSolve.events, 0);
      set((st) => {
        const multiSolve = { ...st.multiSolve, index: 0 };
        const synced = syncSessionToEvent(st, st.currentSessionId, active, true);
        queueMicrotask(persistNow);
        return { multiSolve, ...synced };
      });
      get().refreshOfficialScramble(active);
    },

    advanceMultiSolve: () => {
      const { events, index } = get().multiSolve;
      const nextIdx = index + 1;
      if (nextIdx >= events.length) {
        set((st) => {
          const multiSolve = { ...st.multiSolve, index: events.length };
          queueMicrotask(persistNow);
          return { multiSolve };
        });
        return;
      }
      const active = multiSolveEventAt(events, nextIdx);
      set((st) => {
        const multiSolve = { ...st.multiSolve, index: nextIdx };
        const synced = syncSessionToEvent(
          { ...st, multiSolve },
          st.currentSessionId,
          active,
          true,
        );
        queueMicrotask(persistNow);
        return { multiSolve, ...synced };
      });
      get().refreshOfficialScramble(active);
    },

    timerSetPhase: (phase, patch) =>
      set((st) => ({
        timer: { ...st.timer, phase, ...patch },
      })),

    addSolve: ({ startedAt, endedAt, elapsedMs, penalty }) =>
      set((st) => {
        const session = st.sessions.find((s) => s.id === st.currentSessionId);
        if (!session) return {};
        const { multiMode, roundEvents, roundSize } = getSessionRoundConfig(
          session,
          st.multiSolve,
        );

        const event = session.event;
        const effectiveDiscipline: Discipline = multiMode ? 'multi' : session.discipline;
        const scramble =
          st.scrambleByEvent[event] ?? generateScrambleSync(event);
        const roundId =
          effectiveDiscipline === 'multi'
            ? activeMultiRoundId ?? (activeMultiRoundId = uid())
            : undefined;

        const prevSolves = session.solves;
        const prevBestSingle =
          effectiveDiscipline === 'multi'
            ? null
            : bestMs(
                prevSolves.filter(
                  (s) => s.discipline === effectiveDiscipline && s.event === event,
                ),
              );

        const solve: Solve = {
          id: uid(),
          startedAt,
          endedAt,
          elapsedMs,
          penalty,
          scramble,
          event,
          discipline: effectiveDiscipline,
          xp: null,
          roundId,
        };

        const isSinglePb =
          effectiveDiscipline !== 'multi' &&
          penalty !== 'DNF' &&
          (prevBestSingle == null || solveToMs(solve) < prevBestSingle);

        const nextStreak =
          penalty === 'DNF'
            ? 0
            : (st.xp.currentStreakByDiscipline[effectiveDiscipline] ?? 0) + 1;

        const xpCfg = { otherMultiplier: st.settings.otherDisciplineMultiplier };
        const xpBreakdown =
          effectiveDiscipline === 'multi'
            ? xpForMultiCubeSolve({ event, penalty })
            : xpForSingleSolve({
                event,
                discipline: effectiveDiscipline,
                penalty,
                isPb: isSinglePb,
                nextStreak,
                cfg: xpCfg,
              });

        solve.xp = xpBreakdown;

        const sessions = st.sessions.map((s) =>
          s.id === session.id ? { ...s, solves: [solve, ...s.solves] } : s,
        );

        // XP profile update (transactions + discipline stats + achievements)
        let xp = st.xp;
        const txAt = endedAt;

        xp = pushTransaction(xp, {
          id: uid(),
          at: txAt,
          kind: 'solve',
          discipline: effectiveDiscipline,
          event,
          solveId: solve.id,
          roundId,
          breakdown: xpBreakdown,
        });

        xp = {
          ...xp,
          solveCountByDiscipline: {
            ...xp.solveCountByDiscipline,
            [effectiveDiscipline]:
              (xp.solveCountByDiscipline[effectiveDiscipline] ?? 0) + 1,
          },
          currentStreakByDiscipline: {
            ...xp.currentStreakByDiscipline,
            [effectiveDiscipline]: nextStreak,
          },
        };

        if (effectiveDiscipline === 'blind') {
          if (xp.solveCountByDiscipline.blind === 1) {
            xp = unlockAchievement(xp, 'firstBlindSolve', txAt);
          }
          if (xp.solveCountByDiscipline.blind === 100) {
            xp = unlockAchievement(xp, 'blindMaster100', txAt);
          }
        }
        if (effectiveDiscipline === 'oneHanded') {
          if (xp.solveCountByDiscipline.oneHanded === 1) {
            xp = unlockAchievement(xp, 'firstOneHandedSolve', txAt);
          }
        }

        // Multi: if this was the last cube in a round, award round bonus once.
        const cubesInRound = Math.max(1, roundEvents?.length ?? roundSize);
        const isEndOfRound =
          effectiveDiscipline === 'multi' && st.multiSolve.index + 1 >= cubesInRound;

        if (effectiveDiscipline === 'multi' && isEndOfRound) {
          const newSolves = [solve, ...prevSolves];
          const rounds = groupIntoRounds(newSolves, cubesInRound);
          const newest = rounds[0];
          const roundTotal =
            newest?.complete ? roundTotalMs(newest.solves, newest.solves.length) : null;
          const roundDidDnf = roundTotal == null;

          let best = Infinity;
          for (const r of rounds) {
            if (!r.complete) continue;
            const t = roundTotalMs(r.solves, r.solves.length);
            if (t == null) continue;
            best = Math.min(best, t);
          }
          const isPb = roundTotal != null && roundTotal === best;

          const nextMultiStreak = roundDidDnf
            ? 0
            : (xp.currentStreakByDiscipline.multi ?? 0) + 1;

          const bonusBreakdown = xpForMultiRoundBonus({
            cubesSolved: cubesInRound,
            roundDidDnf,
            isPb,
            nextStreak: nextMultiStreak,
          });

          xp = pushTransaction(xp, {
            id: uid(),
            at: txAt,
            kind: 'multiRoundBonus',
            discipline: 'multi',
            event: null,
            roundId,
            breakdown: bonusBreakdown,
          });

          xp = {
            ...xp,
            multiRoundsCompleted: xp.multiRoundsCompleted + 1,
            bestMultiCubesSolved: Math.max(xp.bestMultiCubesSolved, cubesInRound),
            currentStreakByDiscipline: {
              ...xp.currentStreakByDiscipline,
              multi: nextMultiStreak,
            },
          };

          if (xp.multiRoundsCompleted === 1) {
            xp = unlockAchievement(xp, 'firstMultiSolve', txAt);
          }
          if (cubesInRound >= 5) {
            xp = unlockAchievement(xp, 'multiSolved5Cubes', txAt);
          }
          if (cubesInRound >= 10) {
            xp = unlockAchievement(xp, 'multiSolved10Cubes', txAt);
          }

          activeMultiRoundId = null;
        }

        const scrambleByEvent = shouldAutoNextScramble(event)
          ? { ...st.scrambleByEvent, [event]: generateScrambleSync(event) }
          : st.scrambleByEvent;
        queueMicrotask(persistNow);
        if (shouldAutoNextScramble(event)) {
          queueMicrotask(() => get().refreshOfficialScramble(event));
        }
        return { sessions, lastSolveId: solve.id, scrambleByEvent, xp };
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

    resetAllData: () => {
      clearAllAppStorageBuckets();
      const fresh = initialPersisted();
      set({
        ...fresh,
        timer: defaultTimerState(),
        lastSolveId: null,
      });
      queueMicrotask(() => get().hydrateOfficialScrambles());
    },

    rehydrateFromStorage: () => {
      const fresh = initialPersisted();
      set({
        ...fresh,
        timer: defaultTimerState(),
        lastSolveId: null,
      });
      queueMicrotask(() => get().hydrateOfficialScrambles());
    },

    refreshOfficialScramble: (event) => {
      void generateScramble(event).then((scramble) => {
        set((st) => ({
          scrambleByEvent: { ...st.scrambleByEvent, [event]: scramble },
        }));
        queueMicrotask(persistNow);
      });
    },

    hydrateOfficialScrambles: () => {
      const st = get();
      const events = new Set<CubeEvent>();
      for (const s of st.sessions) events.add(s.event);
      for (const e of st.multiSolve.events) events.add(e);
      for (const event of events) get().refreshOfficialScramble(event);
    },
  };
});

export function useCurrentSession() {
  return useAppStore((s) => s.sessions.find((x) => x.id === s.currentSessionId));
}

