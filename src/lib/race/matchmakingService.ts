import type { CubeEvent } from '../../types';
import { generateScrambleSync } from '../scramble';
import { pickAiOpponent } from './aiOpponents';
import { tryFindOnlineMatch } from './onlineMatchmaking';
import type { RaceMatch } from './types';

export type MatchmakingRequest = {
  userId: string | null;
  displayName: string;
  rating: number;
  event: CubeEvent;
};

/**
 * Matchmaking service: search for a real player up to ~10s, then spawn AI.
 * Returns a Match — timer/UI only see `opponent`, not whether they are AI.
 */
export async function findMatch(req: MatchmakingRequest): Promise<RaceMatch> {
  if (req.userId) {
    const online = await tryFindOnlineMatch({
      userId: req.userId,
      displayName: req.displayName,
      rating: req.rating,
      event: req.event,
    });
    if (online) return online;
  }

  const opponent = pickAiOpponent(req.rating, req.event);
  return {
    id: crypto.randomUUID(),
    event: req.event,
    scramble: generateScrambleSync(req.event),
    opponent,
    createdAt: Date.now(),
  };
}
