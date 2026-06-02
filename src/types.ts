export type CubeEvent =
  | '222'
  | '333'
  | '444'
  | '555'
  | '666'
  | '777'
  | '888'
  | '999'
  | '1010'
  | '1111'
  | '1212'
  | '1313'
  | '1414'
  | '1515'
  | '1616'
  | '1717'
  | '1818'
  | '1919'
  | 'pyra'
  | 'mega'
  | 'kilo'
  | 'sq1'
  | 'clock'
  | 'skewb'
  | 'mirror'
  | 'gear'
  | 'ivy'
  | 'fisher'
  | 'windmill'
  | 'redi'
  | 'dino'
  | 'axis'
  | 'cuboid_3x3x1'
  | 'cuboid_3x3x2'
  | 'cuboid_2x2x3'
  | 'cuboid_1x2x3'
  | 'special';

export type Discipline =
  | 'standard'
  | 'blind'
  | 'oneHanded'
  | 'feet'
  | 'multi'
  | 'other';

export type SolvePenalty = 'OK' | '+2' | 'DNF';

export type AchievementId =
  | 'firstBlindSolve'
  | 'firstOneHandedSolve'
  | 'firstMultiSolve'
  | 'multiSolved5Cubes'
  | 'multiSolved10Cubes'
  | 'blindMaster100';

export type AchievementState = {
  unlocked: boolean;
  unlockedAt: number | null; // epoch ms
};

export type XpBreakdown = {
  baseXp: number;
  disciplineBonusXp: number;
  pbBonusXp: number;
  streakBonusXp: number;
  multiBonusXp: number;
  totalXp: number;
};

export type XpTransactionKind = 'solve' | 'multiRoundBonus';

export type XpTransaction = {
  id: string;
  at: number; // epoch ms
  kind: XpTransactionKind;
  discipline: Discipline;
  event: CubeEvent | null;
  solveId?: string;
  roundId?: string;
  breakdown: XpBreakdown;
};

export type XpProfile = {
  version: 1;
  totalXp: number;
  totalXpByDiscipline: Record<Discipline, number>;
  solveCountByDiscipline: Record<Discipline, number>;
  currentStreakByDiscipline: Record<Discipline, number>;
  multiRoundsCompleted: number;
  bestMultiCubesSolved: number;
  achievements: Record<AchievementId, AchievementState>;
  transactions: XpTransaction[];
  lastEarned: XpTransaction | null;
};

export type Solve = {
  id: string;
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  elapsedMs: number; // raw time without +2
  penalty: SolvePenalty;
  scramble: string;
  event: CubeEvent;
  discipline: Discipline;
  xp: XpBreakdown | null;
  /** Non-null only for multi-cube solves. */
  roundId?: string;
};

export type Session = {
  id: string;
  name: string;
  createdAt: number;
  event: CubeEvent;
  discipline: Discipline;
  /** Stable key representing this setup (mode + cube, or multi cube list). */
  setupKey?: string;
  /** Multi-cube round order for this session (used for stats/times grouping). */
  multiRoundEvents?: CubeEvent[];
  solves: Solve[];
};

export type ThemeAccent = 'blue' | 'violet' | 'cyan' | 'green' | 'pink';

export type Settings = {
  inspectionEnabled: boolean;
  /** Base inspection time (seconds) before +2 */
  inspectionSeconds: number;
  /** Extra inspection seconds per additional cube in multi */
  inspectionBonusPerCubeSeconds: number;
  soundEnabled: boolean;
  timerFontScale: number; // 0.8..1.4
  accent: ThemeAccent;
  /** Configurable multiplier for the "Other" discipline XP. */
  otherDisciplineMultiplier: number;
  /** Whether advanced controls are expanded by default. */
  uiAdvancedOpen: boolean;
  /** Default mode for quick start (used when creating the first setup session). */
  defaultDiscipline: Discipline;
  /** Default cube for quick start (used when creating the first setup session). */
  defaultEvent: CubeEvent;
  /** Default multi cube list (only used when defaultDiscipline is multi). */
  defaultMultiEvents: CubeEvent[];
};

export type MultiSolvePlan = {
  /** 0-based index of next cube in the one-round multi list */
  index: number;
  /** Cubes to solve once each, in order (at least one) */
  events: CubeEvent[];
};

export type TimerPhase =
  | 'idle'
  | 'armed'
  | 'inspecting'
  | 'armedToStart'
  | 'running';

export type TimerState = {
  phase: TimerPhase;
  armedAt: number | null;
  inspectionStartedAt: number | null;
  runningStartedAt: number | null;
  nowMs: number; // updated on RAF/interval for display
};

