import type { AchievementId } from '../../types';

export const ACHIEVEMENT_META: Record<
  AchievementId,
  { title: string; description: string; icon: string }
> = {
  firstBlindSolve: {
    title: 'First Blind Solve',
    description: 'Completed your first blind solve.',
    icon: '🕶',
  },
  firstOneHandedSolve: {
    title: 'First One-Handed Solve',
    description: 'Completed your first one-handed solve.',
    icon: '✋',
  },
  firstMultiSolve: {
    title: 'First Multi Solve',
    description: 'Completed your first multi round.',
    icon: '🧩',
  },
  multiSolved5Cubes: {
    title: 'Solved 5 Cubes in Multi',
    description: 'Completed a 5-cube multi round.',
    icon: '🧩',
  },
  multiSolved10Cubes: {
    title: 'Solved 10 Cubes in Multi',
    description: 'Completed a 10-cube multi round.',
    icon: '🧩',
  },
  blindMaster100: {
    title: 'Blind Master',
    description: 'Completed 100 blind solves.',
    icon: '🏅',
  },
};

