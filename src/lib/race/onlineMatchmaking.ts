import type { CubeEvent } from '../../types';
import { generateScrambleSync } from '../scramble';
import { getSupabase } from '../supabaseClient';
import type { RaceMatch, RaceOpponent } from './types';

const SEARCH_MS = 10_000;
const RATING_BAND = 280;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function opponentFromQueueRow(row: {
  user_id: string;
  display_name: string | null;
  rating: number;
}): RaceOpponent {
  const name = row.display_name?.trim() || 'Racer';
  return {
    id: row.user_id,
    username: name,
    avatar: name.slice(0, 1).toUpperCase(),
    rating: row.rating,
    wins: 40 + Math.floor(Math.random() * 120),
    losses: 30 + Math.floor(Math.random() * 100),
    recentTimesMs: [9200, 9400, 9100, 9300, 9500],
  };
}

export async function tryFindOnlineMatch(input: {
  userId: string;
  displayName: string;
  rating: number;
  event: CubeEvent;
}): Promise<RaceMatch | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { userId, displayName, rating, event } = input;

  await supabase.from('race_queue').delete().eq('user_id', userId);

  const { error: joinErr } = await supabase.from('race_queue').insert({
    user_id: userId,
    display_name: displayName,
    rating,
    event,
  });

  if (joinErr) {
    console.warn('race_queue join:', joinErr.message);
    return null;
  }

  const deadline = Date.now() + SEARCH_MS;

  try {
    while (Date.now() < deadline) {
      const { data: existing } = await supabase
        .from('race_matches')
        .select('id, event, scramble, player_a, player_b, status')
        .or(`player_a.eq.${userId},player_b.eq.${userId}`)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.scramble) {
        const opponentId =
          existing.player_a === userId ? existing.player_b : existing.player_a;
        const { data: oppRow } = await supabase
          .from('race_queue')
          .select('user_id, display_name, rating')
          .eq('user_id', opponentId)
          .maybeSingle();

        const opponent = oppRow
          ? opponentFromQueueRow(oppRow)
          : {
              id: opponentId,
              username: 'Racer',
              avatar: 'R',
              rating: rating + Math.round((Math.random() - 0.5) * 80),
              wins: 50,
              losses: 40,
              recentTimesMs: [9000, 9200, 8800, 9100, 9300],
            };

        await supabase.from('race_queue').delete().eq('user_id', userId);

        return {
          id: existing.id,
          event: existing.event as CubeEvent,
          scramble: existing.scramble,
          opponent,
          createdAt: Date.now(),
        };
      }

      const { data: candidates } = await supabase
        .from('race_queue')
        .select('user_id, display_name, rating, created_at')
        .eq('event', event)
        .neq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(8);

      const foe = candidates?.find(
        (c) => Math.abs((c.rating ?? 1200) - rating) <= RATING_BAND,
      );

      if (foe) {
        const matchId = crypto.randomUUID();
        const scramble = generateScrambleSync(event);

        const { error: matchErr } = await supabase.from('race_matches').insert({
          id: matchId,
          event,
          scramble,
          player_a: userId,
          player_b: foe.user_id,
          status: 'ready',
        });

        if (!matchErr) {
          await supabase.from('race_queue').delete().eq('user_id', userId);

          return {
            id: matchId,
            event,
            scramble,
            opponent: opponentFromQueueRow({
              user_id: foe.user_id,
              display_name: foe.display_name,
              rating: foe.rating ?? 1200,
            }),
            createdAt: Date.now(),
          };
        }
      }

      await sleep(700);
    }
  } finally {
    await supabase.from('race_queue').delete().eq('user_id', userId);
  }

  return null;
}
