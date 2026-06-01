import type { CubeEvent } from '../types';
import { MULTI_PICKER_EVENTS } from './events';

type Axis = 'x' | 'y' | 'z';
type Suffix = '' | "'" | '2';

/** WCA event IDs for cubing.js `randomScrambleForEvent`. */
const CUBING_EVENT: Partial<Record<CubeEvent, string>> = {
  '222': '222',
  '333': '333',
  '444': '444',
  '555': '555',
  '666': '666',
  '777': '777',
  pyra: 'pyram',
  mega: 'minx',
  kilo: 'kilominx',
  sq1: 'sq1',
  clock: 'clock',
  skewb: 'skewb',
  redi: 'redi_cube',
};

const THREEX3_SHAPE_EVENTS = new Set<CubeEvent>([
  'mirror',
  'fisher',
  'windmill',
  'axis',
  'gear',
  'dino',
  'special',
  'cuboid_3x3x1',
  'cuboid_3x3x2',
  'cuboid_2x2x3',
  'cuboid_1x2x3',
]);

const FACE_AXIS: Record<string, Axis> = {
  R: 'x',
  L: 'x',
  U: 'y',
  D: 'y',
  F: 'z',
  B: 'z',
  Rw: 'x',
  Lw: 'x',
  Uw: 'y',
  Dw: 'y',
  Fw: 'z',
  Bw: 'z',
};

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function moveToAxis(move: string): Axis {
  const base = move.endsWith('w') ? move.slice(0, 2) : move[0];
  return FACE_AXIS[base] ?? 'x';
}

function genMoves(faces: string[], len: number) {
  const suffixes: Suffix[] = ['', "'", '2'];
  const moves: string[] = [];
  let attempts = 0;
  while (moves.length < len && attempts < len * 40) {
    attempts += 1;
    const face = pick(faces);
    const suf = pick(suffixes);
    const move = `${face}${suf}`;

    const prev = moves[moves.length - 1];
    if (prev) {
      const prevFace = prev.endsWith('w') ? prev.slice(0, 2) : prev[0];
      const faceBase = face.endsWith('w') ? face.slice(0, 2) : face[0];
      if (prevFace === faceBase) continue;

      const prevAxis = moveToAxis(prev);
      const nextAxis = moveToAxis(move);
      const prevPrev = moves[moves.length - 2];
      if (prevPrev) {
        const prevPrevAxis = moveToAxis(prevPrev);
        if (prevPrevAxis === prevAxis && prevAxis === nextAxis) continue;
      }
    }

    moves.push(move);
  }
  return moves.join(' ');
}

export function cubeSizeFromEvent(event: CubeEvent): number | null {
  if (/^\d{3}$/.test(event)) {
    const [a, b, c] = event;
    if (a === b && b === c) return Number(a);
  }
  if (/^\d{4}$/.test(event)) {
    const n = Number(event.slice(0, 2));
    if (event.slice(2) === event.slice(0, 2) && n >= 2) return n;
  }
  return null;
}

function nxnMoveCount(size: number) {
  if (size <= 4) return 40;
  if (size <= 7) return 10 * size + 10;
  return 10 * size + 20;
}

function genBigCubeScramble(size: number) {
  const faces = ['R', 'L', 'U', 'D', 'F', 'B'];
  const wide = faces.map((f) => `${f}w`);
  return genMoves([...faces, ...wide], nxnMoveCount(size));
}

/** Pyraminx — L/R/U/B + tips (valid random-move scramble). */
function genPyraminxScramble() {
  return genMoves(['U', 'R', 'L', 'B', 'u', 'r', 'l', 'b'], 11);
}

/** Skewb — 4 face turns. */
function genSkewbScramble() {
  return genMoves(['R', 'L', 'U', 'B'], 11);
}

/** Square-1 — random slice moves in WCA-style notation. */
function genSq1Scramble() {
  const parts: string[] = [];
  const n = 11 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i += 1) {
    const top = Math.floor(Math.random() * 12) - 6;
    let bottom = Math.floor(Math.random() * 12) - 6;
    if (top === 0 && bottom === 0) bottom = 1;
    parts.push(`(${top}, ${bottom})`);
  }
  return parts.join(' / ');
}

/** Clock — WCA-style pin + turn scramble (simplified valid format). */
function genClockScramble() {
  const pins = ['UR', 'DR', 'DL', 'UL'];
  const pin = pick(pins);
  const parts: string[] = [];
  const faces = ['U', 'R', 'D', 'L'];
  for (let i = 0; i < 9; i += 1) {
    const n = Math.floor(Math.random() * 7) - 3;
    if (n !== 0) parts.push(`${pick(faces)}${n > 0 ? `${n}+` : `${-n}-`}`);
  }
  parts.push(`ALL${Math.floor(Math.random() * 7) - 3 >= 0 ? '+' : '-'}`);
  return `${pin} ${parts.join(' ')}`.replace(/\s+/g, ' ').trim();
}

/** Megaminx — face-turn notation (R++/D-- style). */
function genMegaminxScramble() {
  const faces = ['R', 'D', 'L', 'B'];
  const suffixes = ['++', '--'];
  const lines: string[] = [];
  for (let line = 0; line < 7; line += 1) {
    const moves: string[] = [];
    const count = 8 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i += 1) {
      moves.push(`${pick(faces)}${pick(suffixes)}`);
    }
    lines.push(moves.join(' ') + (line < 6 ? '' : " U'"));
  }
  return lines.join('\n');
}

function syncFallbackScramble(event: CubeEvent): string {
  const size = cubeSizeFromEvent(event);
  if (size != null) {
    if (size === 2) return genMoves(['R', 'L', 'U', 'D', 'F', 'B'], 11);
    if (size === 3) return genMoves(['R', 'L', 'U', 'D', 'F', 'B'], 20);
    if (size === 4) {
      return genMoves(
        ['R', 'L', 'U', 'D', 'F', 'B', 'Rw', 'Lw', 'Uw', 'Dw', 'Fw', 'Bw'],
        40,
      );
    }
    if (size >= 8) return genBigCubeScramble(size);
    return genBigCubeScramble(size);
  }

  switch (event) {
    case 'pyra':
      return genPyraminxScramble();
    case 'skewb':
    case 'ivy':
      return genSkewbScramble();
    case 'sq1':
      return genSq1Scramble();
    case 'clock':
      return genClockScramble();
    case 'mega':
    case 'kilo':
      return genMegaminxScramble();
    case 'redi':
      return genMoves(['R', 'L', 'U', 'D', 'F', 'B'], 20);
    default:
      if (THREEX3_SHAPE_EVENTS.has(event)) {
        return genMoves(['R', 'L', 'U', 'D', 'F', 'B'], 20);
      }
      return genMoves(['R', 'L', 'U', 'D', 'F', 'B'], 20);
  }
}

function cubingEventId(event: CubeEvent): string | null {
  if (CUBING_EVENT[event]) return CUBING_EVENT[event]!;
  if (THREEX3_SHAPE_EVENTS.has(event)) return '333';
  if (event === 'ivy') return 'skewb';
  const size = cubeSizeFromEvent(event);
  if (size != null && size >= 2 && size <= 7) {
    return String(size).repeat(3);
  }
  return null;
}

async function fetchCubingScramble(event: CubeEvent): Promise<string | null> {
  const id = cubingEventId(event);
  if (!id) return null;
  try {
    const { randomScrambleForEvent } = await import('cubing/scramble');
    const alg = await randomScrambleForEvent(id);
    return String(alg).trim();
  } catch {
    return null;
  }
}

/**
 * WCA-quality scramble when cubing.js is available; solid fallback otherwise.
 */
export async function generateScramble(event: CubeEvent): Promise<string> {
  const official = await fetchCubingScramble(event);
  if (official) return official;
  return syncFallbackScramble(event);
}

/** Sync scramble for store init (fallback only; prefer async generateScramble). */
export function generateScrambleSync(event: CubeEvent): string {
  return syncFallbackScramble(event);
}

export function shouldAutoNextScramble(_event: CubeEvent) {
  return true;
}

export function buildDefaultScrambleMap(): Record<CubeEvent, string> {
  const map = {} as Record<CubeEvent, string>;
  for (const event of MULTI_PICKER_EVENTS) {
    map[event] = generateScrambleSync(event);
  }
  return map;
}
