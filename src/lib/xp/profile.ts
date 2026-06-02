import type {
  AchievementId,
  AchievementState,
  Discipline,
  XpProfile,
  XpTransaction,
} from '../../types';
import { XP_DEFAULTS } from './config';

function zeroByDiscipline<T extends number>(v: T): Record<Discipline, T> {
  return {
    standard: v,
    blind: v,
    oneHanded: v,
    feet: v,
    multi: v,
    other: v,
  };
}

export function defaultAchievements(): Record<AchievementId, AchievementState> {
  return {
    firstBlindSolve: { unlocked: false, unlockedAt: null },
    firstOneHandedSolve: { unlocked: false, unlockedAt: null },
    firstMultiSolve: { unlocked: false, unlockedAt: null },
    multiSolved5Cubes: { unlocked: false, unlockedAt: null },
    multiSolved10Cubes: { unlocked: false, unlockedAt: null },
    blindMaster100: { unlocked: false, unlockedAt: null },
  };
}

export function createEmptyXpProfile(): XpProfile {
  return {
    version: 1,
    totalXp: 0,
    totalXpByDiscipline: zeroByDiscipline(0),
    solveCountByDiscipline: zeroByDiscipline(0),
    currentStreakByDiscipline: zeroByDiscipline(0),
    multiRoundsCompleted: 0,
    bestMultiCubesSolved: 0,
    achievements: defaultAchievements(),
    transactions: [],
    lastEarned: null,
  };
}

export function pushTransaction(profile: XpProfile, tx: XpTransaction): XpProfile {
  const next: XpProfile = {
    ...profile,
    totalXp: profile.totalXp + tx.breakdown.totalXp,
    totalXpByDiscipline: {
      ...profile.totalXpByDiscipline,
      [tx.discipline]:
        (profile.totalXpByDiscipline[tx.discipline] ?? 0) + tx.breakdown.totalXp,
    },
    transactions: [...profile.transactions, tx].slice(-XP_DEFAULTS.maxTransactions),
    lastEarned: tx,
  };
  return next;
}

export function unlockAchievement(
  profile: XpProfile,
  id: AchievementId,
  at: number,
): XpProfile {
  const cur = profile.achievements[id];
  if (cur?.unlocked) return profile;
  return {
    ...profile,
    achievements: {
      ...profile.achievements,
      [id]: { unlocked: true, unlockedAt: at },
    },
  };
}

