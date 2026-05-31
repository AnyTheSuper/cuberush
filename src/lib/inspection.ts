import type { Settings } from '../types';

export type InspectionLimits = {
  limitMs: number;
  plus2Ms: number;
  dnfMs: number;
};

/** WCA-style: +2 after limit, DNF after limit + 2s */
export function getInspectionLimits(
  settings: Settings,
  cubeCount: number,
): InspectionLimits {
  const baseMs = Math.max(0, settings.inspectionSeconds) * 1000;
  const extraCubes = Math.max(0, cubeCount - 1);
  const bonusMs =
    extraCubes * Math.max(0, settings.inspectionBonusPerCubeSeconds) * 1000;
  const limitMs = baseMs + bonusMs;
  return {
    limitMs,
    plus2Ms: limitMs,
    dnfMs: limitMs + 2000,
  };
}

export function inspectionPenaltyFromElapsed(
  elapsedMs: number,
  limits: InspectionLimits,
): 'OK' | '+2' | 'DNF' {
  if (elapsedMs > limits.dnfMs) return 'DNF';
  if (elapsedMs > limits.plus2Ms) return '+2';
  return 'OK';
}
