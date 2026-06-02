import type { CubeEvent, Discipline } from '../../types';

export const DISCIPLINE_MULTIPLIER_DEFAULTS: Record<Discipline, number> = {
  standard: 1.0,
  oneHanded: 1.3,
  blind: 2.0,
  feet: 2.5,
  // Multi does not use a simple multiplier (handled separately by engine)
  multi: 1.0,
  other: 1.2,
};

export const MULTI_BONUS_TABLE: Record<number, number> = {
  2: 10,
  3: 20,
  5: 50,
  10: 150,
  20: 400,
};

export const XP_DEFAULTS = {
  /** Fallback base XP if event not configured. */
  baseXpFallback: 100,
  /** Flat bonus when a solve is a new PB for that discipline+event. */
  pbBonusXp: 25,
  /** Flat bonus when a multi round total is a new PB. */
  multiPbBonusXp: 50,
  /** Streak bonus grows with streak length and caps. */
  streak: {
    perSolveXp: 2,
    capXp: 50,
  },
  /** Prevent runaway storage size. */
  maxTransactions: 2000,
} as const;

/**
 * Base puzzle XP by event.
 * Keep these simple and easy to tweak; disciplines modify these values.
 */
export const BASE_XP_BY_EVENT: Partial<Record<CubeEvent, number>> = {
  '222': 80,
  '333': 100,
  '444': 140,
  '555': 180,
  '666': 230,
  '777': 280,
  mega: 170,
  kilo: 150,
  pyra: 90,
  skewb: 90,
  sq1: 120,
  clock: 110,
  mirror: 110,
  gear: 120,
  ivy: 85,
  fisher: 115,
  windmill: 115,
  redi: 95,
  dino: 90,
  axis: 120,
  cuboid_3x3x1: 85,
  cuboid_3x3x2: 95,
  cuboid_2x2x3: 95,
  cuboid_1x2x3: 95,
  special: 120,
};

export function baseXpForEvent(event: CubeEvent): number {
  return BASE_XP_BY_EVENT[event] ?? XP_DEFAULTS.baseXpFallback;
}

export function multiBonusForCubes(cubesSolved: number): number {
  return MULTI_BONUS_TABLE[cubesSolved] ?? 0;
}

