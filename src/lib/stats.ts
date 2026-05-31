import type { Solve } from '../types';
import { formatMs } from './time';

export function solveToMs(s: Solve) {
  const raw = Number(s.elapsedMs);
  if (!Number.isFinite(raw) || raw < 0) return Infinity;
  if (s.penalty === 'DNF') return Infinity;
  return s.penalty === '+2' ? raw + 2000 : raw;
}

export function formatSolveTime(s: Solve) {
  if (s.penalty === 'DNF') return 'DNF';
  const shown = formatMs(s.elapsedMs);
  if (s.penalty === '+2') return `${shown}+`;
  return shown;
}

/** Newest solves are stored first (index 0 = latest). */
export function recentSolves(solves: Solve[], count: number) {
  return solves.slice(0, count);
}

export function bestMs(solves: Solve[]) {
  let best = Infinity;
  for (const s of solves) best = Math.min(best, solveToMs(s));
  return best === Infinity ? null : best;
}

export function averageMs(solves: Solve[]) {
  if (solves.length === 0) return null;
  const finite = solves.map(solveToMs).filter(Number.isFinite);
  if (finite.length === 0) return null;
  return finite.reduce((a, b) => a + b, 0) / finite.length;
}

/** Sum of solve times for a multi round (newest-first list, first `count` solves). */
export function roundTotalMs(solves: Solve[], count: number): number | null {
  const round = recentSolves(solves, count);
  if (round.length === 0) return null;
  if (round.some((s) => s.penalty === 'DNF')) return null;
  const total = round.reduce((sum, s) => sum + solveToMs(s), 0);
  return Number.isFinite(total) ? total : null;
}

export function aoNMs(solves: Solve[], n: number) {
  if (solves.length < n) return null;
  const window = recentSolves(solves, n);
  const values = window.map(solveToMs);

  if (values.length < 3) {
    const finite = values.filter(Number.isFinite);
    if (finite.length === 0) return null;
    return finite.reduce((a, b) => a + b, 0) / finite.length;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  if (trimmed.some((v) => !Number.isFinite(v))) return null;
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}
