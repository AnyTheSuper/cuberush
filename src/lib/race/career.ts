import type { SolvePenalty } from '../../types';
import type {
  RaceCareerProfile,
  RaceHistoryEntry,
  RaceOutcome,
} from './types';
import { defaultRaceCareer } from './types';

function solveMs(elapsedMs: number, penalty: SolvePenalty): number | null {
  if (penalty === 'DNF') return null;
  return elapsedMs + (penalty === '+2' ? 2000 : 0);
}

export function resolveRaceOutcome(
  playerMs: number | null,
  opponentMs: number | null,
): RaceOutcome {
  if (playerMs == null && opponentMs == null) return 'draw';
  if (playerMs == null) return 'dnf_loss';
  if (opponentMs == null) return 'dnf_win';
  if (playerMs < opponentMs) return 'win';
  if (playerMs > opponentMs) return 'loss';
  return 'draw';
}

export function ratingDelta(outcome: RaceOutcome, playerRating: number, opponentRating: number): number {
  const expected = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
  const score = outcome === 'win' || outcome === 'dnf_win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  return Math.round(32 * (score - expected));
}

export function applyRaceResult(
  career: RaceCareerProfile,
  input: {
    event: RaceHistoryEntry['event'];
    opponentUsername: string;
    playerElapsedMs: number;
    playerPenalty: SolvePenalty;
    opponentMs: number | null;
  },
): { career: RaceCareerProfile; outcome: RaceOutcome; entry: RaceHistoryEntry } {
  const base = career.version === 1 ? career : defaultRaceCareer();
  const playerMs = solveMs(input.playerElapsedMs, input.playerPenalty);
  const outcome = resolveRaceOutcome(playerMs, input.opponentMs);
  const delta = ratingDelta(outcome, base.rating, base.rating);
  const playerRatingAfter = Math.max(100, base.rating + delta);

  const won = outcome === 'win' || outcome === 'dnf_win';
  const lost = outcome === 'loss' || outcome === 'dnf_loss';
  const winStreak = won ? base.winStreak + 1 : 0;

  const entry: RaceHistoryEntry = {
    id: Math.random().toString(16).slice(2) + Date.now().toString(16),
    at: Date.now(),
    event: input.event,
    outcome,
    playerMs,
    opponentMs: input.opponentMs,
    opponentUsername: input.opponentUsername,
    ratingDelta: delta,
    playerRatingAfter,
  };

  const history = [entry, ...base.history].slice(0, 50);

  return {
    outcome,
    entry,
    career: {
      ...base,
      rating: playerRatingAfter,
      wins: base.wins + (won ? 1 : 0),
      losses: base.losses + (lost ? 1 : 0),
      winStreak,
      bestWinStreak: Math.max(base.bestWinStreak, winStreak),
      history,
    },
  };
}
