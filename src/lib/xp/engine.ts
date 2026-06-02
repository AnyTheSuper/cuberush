import type { CubeEvent, Discipline, SolvePenalty, XpBreakdown } from '../../types';
import {
  DISCIPLINE_MULTIPLIER_DEFAULTS,
  XP_DEFAULTS,
  baseXpForEvent,
  multiBonusForCubes,
} from './config';

export type XpEngineConfig = {
  otherMultiplier?: number;
};

export type XpStreakState = {
  streak: number;
};

export function disciplineMultiplier(
  discipline: Discipline,
  cfg: XpEngineConfig,
): number {
  if (discipline === 'other' && typeof cfg.otherMultiplier === 'number') {
    return cfg.otherMultiplier;
  }
  return DISCIPLINE_MULTIPLIER_DEFAULTS[discipline] ?? 1.0;
}

export function streakBonusXp(streak: number) {
  const raw = Math.max(0, streak) * XP_DEFAULTS.streak.perSolveXp;
  return Math.min(XP_DEFAULTS.streak.capXp, raw);
}

export function xpForSingleSolve(input: {
  event: CubeEvent;
  discipline: Discipline;
  penalty: SolvePenalty;
  isPb: boolean;
  nextStreak: number;
  cfg: XpEngineConfig;
}): XpBreakdown {
  const base = baseXpForEvent(input.event);
  const mult = disciplineMultiplier(input.discipline, input.cfg);

  const scaledBase = input.penalty === 'DNF' ? 0 : Math.round(base * mult);
  const disciplineBonus = input.penalty === 'DNF' ? 0 : Math.max(0, scaledBase - base);
  const pb = input.penalty === 'DNF' ? 0 : input.isPb ? XP_DEFAULTS.pbBonusXp : 0;
  const streak = input.penalty === 'DNF' ? 0 : streakBonusXp(input.nextStreak);

  const total = scaledBase + pb + streak;
  return {
    baseXp: scaledBase,
    disciplineBonusXp: disciplineBonus,
    pbBonusXp: pb,
    streakBonusXp: streak,
    multiBonusXp: 0,
    totalXp: total,
  };
}

/**
 * Multi per-cube solve XP (no multipliers, no bonuses).
 * Bonuses are awarded once per completed round via `xpForMultiRoundBonus`.
 */
export function xpForMultiCubeSolve(input: {
  event: CubeEvent;
  penalty: SolvePenalty;
}): XpBreakdown {
  const base = baseXpForEvent(input.event);
  const scaledBase = input.penalty === 'DNF' ? 0 : base;
  return {
    baseXp: scaledBase,
    disciplineBonusXp: 0,
    pbBonusXp: 0,
    streakBonusXp: 0,
    multiBonusXp: 0,
    totalXp: scaledBase,
  };
}

export function xpForMultiRoundBonus(input: {
  cubesSolved: number;
  roundDidDnf: boolean;
  isPb: boolean;
  nextStreak: number;
}): XpBreakdown {
  const multiBonus = input.roundDidDnf ? 0 : multiBonusForCubes(input.cubesSolved);
  const pb = input.roundDidDnf ? 0 : input.isPb ? XP_DEFAULTS.multiPbBonusXp : 0;
  const streak = input.roundDidDnf ? 0 : streakBonusXp(input.nextStreak);
  const total = multiBonus + pb + streak;
  return {
    baseXp: 0,
    disciplineBonusXp: 0,
    pbBonusXp: pb,
    streakBonusXp: streak,
    multiBonusXp: multiBonus,
    totalXp: total,
  };
}

