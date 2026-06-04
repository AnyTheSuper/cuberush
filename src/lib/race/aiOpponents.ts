import type { CubeEvent } from '../../types';
import type { RaceOpponent } from './types';

export type AiPersona = {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  wins: number;
  losses: number;
  recentTimesMs: number[];
};

const PERSONAS: AiPersona[] = [
  {
    id: 'ai-cubemaster42',
    username: 'CubeMaster42',
    avatar: '🟦',
    rating: 1420,
    wins: 318,
    losses: 201,
    recentTimesMs: [9120, 9340, 8890, 9010, 9280],
  },
  {
    id: 'ai-speeddemon',
    username: 'SpeedDemon',
    avatar: '⚡',
    rating: 1580,
    wins: 402,
    losses: 178,
    recentTimesMs: [7840, 8010, 7920, 8100, 7760],
  },
  {
    id: 'ai-twistking',
    username: 'TwistKing',
    avatar: '👑',
    rating: 1310,
    wins: 245,
    losses: 260,
    recentTimesMs: [10240, 10410, 10180, 10320, 10500],
  },
  {
    id: 'ai-f2lwizard',
    username: 'F2LWizard',
    avatar: '🧙',
    rating: 1490,
    wins: 367,
    losses: 214,
    recentTimesMs: [8450, 8620, 8380, 8510, 8590],
  },
  {
    id: 'ai-cubebotx',
    username: 'CubeBotX',
    avatar: '🤖',
    rating: 1650,
    wins: 512,
    losses: 145,
    recentTimesMs: [7280, 7410, 7350, 7520, 7190],
  },
  {
    id: 'ai-blitzcube',
    username: 'BlitzCube',
    avatar: '🔥',
    rating: 1180,
    wins: 198,
    losses: 287,
    recentTimesMs: [11200, 11450, 11120, 11380, 11090],
  },
  {
    id: 'ai-neonturn',
    username: 'NeonTurn',
    avatar: '💜',
    rating: 1360,
    wins: 276,
    losses: 241,
    recentTimesMs: [9680, 9820, 9540, 9710, 9900],
  },
];

function eventTimeScale(event: CubeEvent): number {
  if (event === '222') return 0.42;
  if (event === '444') return 1.85;
  if (event === '555') return 2.8;
  if (event === 'pyra') return 0.55;
  if (event === 'skewb') return 0.5;
  return 1;
}

/** Pick an AI persona near the player's rating. */
export function pickAiOpponent(playerRating: number, event: CubeEvent): RaceOpponent {
  const sorted = [...PERSONAS].sort(
    (a, b) =>
      Math.abs(a.rating - playerRating) - Math.abs(b.rating - playerRating),
  );
  const pool = sorted.slice(0, 3);
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? sorted[0];
  const scale = eventTimeScale(event);
  const recentTimesMs = pick.recentTimesMs.map((t) =>
    Math.round(t * scale * (0.92 + Math.random() * 0.16)),
  );
  return {
    id: pick.id,
    username: pick.username,
    avatar: pick.avatar,
    rating: pick.rating + Math.round((Math.random() - 0.5) * 40),
    wins: pick.wins + Math.floor(Math.random() * 20),
    losses: pick.losses + Math.floor(Math.random() * 20),
    recentTimesMs,
  };
}

/** Simulate opponent solve time (ms) from rating + event. */
export function simulateAiSolveMs(rating: number, event: CubeEvent): number {
  const scale = eventTimeScale(event);
  const base333 = 16800 - rating * 5.2;
  const mean = Math.max(4500, base333 * scale);
  const jitter = (Math.random() - 0.5) * mean * 0.12;
  const mistake = Math.random() < 0.08 ? mean * 0.22 : 0;
  return Math.round(mean + jitter + mistake);
}
