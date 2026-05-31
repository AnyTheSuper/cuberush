import type { CubeEvent, Discipline, Solve } from '../types';

export const EVENT_LABEL: Record<CubeEvent, string> = {
  '222': '2×2',
  '333': '3×3',
  '444': '4×4',
  '555': '5×5',
  '666': '6×6',
  '777': '7×7',
  '888': '8×8',
  '999': '9×9',
  '1010': '10×10',
  '1111': '11×11',
  '1212': '12×12',
  '1313': '13×13',
  '1414': '14×14',
  '1515': '15×15',
  '1616': '16×16',
  '1717': '17×17',
  '1818': '18×18',
  '1919': '19×19',
  pyra: 'Pyraminx',
  mega: 'Megaminx',
  kilo: 'Kilominx',
  sq1: 'Square-1',
  clock: 'Clock',
  skewb: 'Skewb',
  mirror: 'Mirror 3×3',
  gear: 'Gear',
  ivy: 'Ivy',
  fisher: 'Fisher',
  windmill: 'Windmill',
  redi: 'Redi',
  dino: 'Dino',
  axis: 'Axis',
  cuboid_3x3x1: '3×3×1',
  cuboid_3x3x2: '3×3×2',
  cuboid_2x2x3: '2×2×3',
  cuboid_1x2x3: '1×2×3',
  special: 'Special',
};

export type PuzzleCategory = {
  title: string;
  events: CubeEvent[];
};

/** All puzzles available in the multi-cube picker (grouped like CSTimer). */
export const PUZZLE_CATEGORIES: PuzzleCategory[] = [
  {
    title: 'Standard cube',
    events: [
      '222',
      '333',
      '444',
      '555',
      '666',
      '777',
      '888',
      '999',
      '1010',
      '1111',
      '1212',
      '1313',
    ],
  },
  {
    title: 'Big cubes',
    events: ['1414', '1515', '1616', '1717', '1818', '1919'],
  },
  { title: 'Pyraminx', events: ['pyra'] },
  { title: 'Megaminx', events: ['kilo', 'mega'] },
  {
    title: 'Cuboid',
    events: [
      'cuboid_3x3x1',
      'cuboid_3x3x2',
      'cuboid_2x2x3',
      'cuboid_1x2x3',
    ],
  },
  {
    title: 'Other',
    events: [
      'mirror',
      'skewb',
      'sq1',
      'clock',
      'gear',
      'ivy',
      'fisher',
      'windmill',
      'redi',
      'dino',
      'axis',
      'special',
    ],
  },
];

export const MULTI_PICKER_EVENTS: CubeEvent[] = PUZZLE_CATEGORIES.flatMap(
  (c) => c.events,
);

export function eventLabel(event: CubeEvent) {
  return EVENT_LABEL[event] ?? event;
}

export const DISCIPLINE_LABEL: Record<Discipline, string> = {
  standard: 'Standard',
  blind: 'Blind',
  oneHanded: 'One-handed',
  feet: 'Feet',
  multi: 'Multi',
  other: 'Other',
};

export function disciplineLabel(discipline: Discipline) {
  return DISCIPLINE_LABEL[discipline] ?? discipline;
}

export function multiSolveEventAt(
  events: CubeEvent[],
  index: number,
): CubeEvent {
  if (events.length === 0) return '333';
  const clamped = Math.min(Math.max(0, index), events.length - 1);
  return events[clamped];
}

export function multiSolveTotal(events: CubeEvent[]) {
  return Math.max(1, events.length);
}

export function isMultiComplete(multi: { index: number; events: CubeEvent[] }) {
  return multi.index >= multi.events.length;
}

/** Whether the timer should run as a continuous multi-cube round right now. */
export function isLiveMultiMode(
  session: { discipline?: Discipline } | undefined,
  multiSolve: { events: CubeEvent[] },
) {
  const discipline = session?.discipline ?? 'standard';
  return discipline === 'multi' || multiSolve.events.length > 1;
}

/** Round grouping config for a session (persisted plan beats live picker). */
export function getSessionRoundConfig(
  session: { multiRoundEvents?: CubeEvent[]; solves: Solve[] } | undefined,
  multiSolve: { events: CubeEvent[] },
) {
  const stored = session?.multiRoundEvents;
  const roundEvents =
    stored && stored.length > 1
      ? stored
      : multiSolve.events.length > 1
        ? multiSolve.events
        : inferMultiRoundEvents(session?.solves ?? []);

  if (roundEvents && roundEvents.length > 1) {
    return {
      multiMode: true as const,
      roundEvents,
      roundSize: roundEvents.length,
    };
  }

  return {
    multiMode: false as const,
    roundEvents: null as CubeEvent[] | null,
    roundSize: 1,
  };
}

/** Detect repeating multi-cube rounds from stored solves (oldest-first groups). */
export function inferMultiRoundEvents(solves: Solve[]): CubeEvent[] | null {
  if (solves.length < 4) return null;

  for (let size = 2; size <= Math.min(10, solves.length); size++) {
    const chrono = [...solves].reverse();
    const completeCount = Math.floor(chrono.length / size) * size;
    if (completeCount < size * 2) continue;

    const reference = chrono.slice(0, size).map((s) => s.event);
    const referenceSet = new Set(reference);
    if (referenceSet.size < 2) continue;

    let matches = true;
    for (let i = 0; i < completeCount; i += size) {
      const group = chrono.slice(i, i + size).map((s) => s.event);
      const groupSet = new Set(group);
      if (groupSet.size !== referenceSet.size) {
        matches = false;
        break;
      }
      for (const event of referenceSet) {
        if (!groupSet.has(event)) {
          matches = false;
          break;
        }
      }
    }

    if (matches) return reference;
  }

  return null;
}
