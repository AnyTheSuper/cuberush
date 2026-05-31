import type { Solve } from '../types';
import { roundTotalMs } from './stats';

export type RoundGroup = {
  id: string;
  solves: Solve[];
  complete: boolean;
};

export function groupIntoRounds(solves: Solve[], roundSize: number): RoundGroup[] {
  const size = Math.max(1, roundSize);
  const groups: RoundGroup[] = [];
  for (let i = 0; i < solves.length; i += size) {
    const chunk = solves.slice(i, i + size);
    groups.push({
      id: chunk.map((s) => s.id).join('-'),
      solves: chunk,
      complete: chunk.length === size,
    });
  }
  return groups;
}

export type RoundChartPoint = {
  round: number;
  ms: number;
};

/** Oldest round first — for line charts. DNF rounds omitted. */
export function roundsToChartData(
  solves: Solve[],
  roundSize: number,
): RoundChartPoint[] {
  const groups = groupIntoRounds(solves, roundSize)
    .filter((g) => g.complete)
    .reverse();

  const points: RoundChartPoint[] = [];
  for (let i = 0; i < groups.length; i++) {
    const total = roundTotalMs(groups[i].solves, groups[i].solves.length);
    if (total != null) points.push({ round: i + 1, ms: total });
  }
  return points;
}

/** Complete round totals, newest round first (matches solve list order). */
export function roundTimesMsNewestFirst(
  solves: Solve[],
  roundSize: number,
): number[] {
  return groupIntoRounds(solves, roundSize)
    .filter((g) => g.complete)
    .map((g) => roundTotalMs(g.solves, g.solves.length))
    .filter((ms): ms is number => ms != null);
}

export function bestRoundMs(times: number[]) {
  if (times.length === 0) return null;
  return Math.min(...times);
}

export function averageRoundMs(times: number[]) {
  if (times.length === 0) return null;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

export function aoNRoundMs(times: number[], n: number) {
  if (times.length < n) return null;
  const window = times.slice(0, n);

  if (window.length < 3) {
    return window.reduce((a, b) => a + b, 0) / window.length;
  }

  const sorted = [...window].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export function roundSessionStats(solves: Solve[], roundSize: number) {
  const times = roundTimesMsNewestFirst(solves, roundSize);
  return {
    times,
    best: bestRoundMs(times),
    avg: averageRoundMs(times),
    ao5: aoNRoundMs(times, 5),
    ao12: aoNRoundMs(times, 12),
    roundCount: times.length,
  };
}
