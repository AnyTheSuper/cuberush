import type { CubeEvent } from '../../types';

/** Opponent presented to the UI — human or AI look the same. */
export type RaceOpponent = {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  wins: number;
  losses: number;
  /** Recent solve totals (ms), newest first. */
  recentTimesMs: number[];
};

export type RaceMatch = {
  id: string;
  event: CubeEvent;
  scramble: string;
  opponent: RaceOpponent;
  createdAt: number;
};

export type RaceOutcome = 'win' | 'loss' | 'dnf_win' | 'dnf_loss' | 'draw';

export type RaceHistoryEntry = {
  id: string;
  at: number;
  event: CubeEvent;
  outcome: RaceOutcome;
  playerMs: number | null;
  opponentMs: number | null;
  opponentUsername: string;
  ratingDelta: number;
  playerRatingAfter: number;
};

export type RaceCareerProfile = {
  version: 1;
  rating: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestWinStreak: number;
  history: RaceHistoryEntry[];
};

export type RaceFlowPhase =
  | 'idle'
  | 'searching'
  | 'ready'
  | 'countdown'
  | 'racing'
  | 'results';

export function defaultRaceCareer(): RaceCareerProfile {
  return {
    version: 1,
    rating: 1200,
    wins: 0,
    losses: 0,
    winStreak: 0,
    bestWinStreak: 0,
    history: [],
  };
}
