import type { CubeEvent } from '../types';

type Axis = 'x' | 'y' | 'z';
type Suffix = '' | "'" | '2';

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
  const base = move.endsWith('w') ? move : move[0];
  return FACE_AXIS[base] ?? 'x';
}

function genMoves(faces: string[], len: number) {
  const suffixes: Suffix[] = ['', "'", '2'];
  const moves: string[] = [];
  while (moves.length < len) {
    const face = pick(faces);
    const suf = pick(suffixes);
    const move = `${face}${suf}`;

    const prev = moves[moves.length - 1];
    if (prev) {
      const prevFace = prev.endsWith('w') ? prev.slice(0, 2) : prev[0];
      const faceBase = face.endsWith('w') ? face.slice(0, 2) : face[0];
      if (prevFace === faceBase) continue; // avoid same face twice

      const prevAxis = moveToAxis(prev);
      const nextAxis = moveToAxis(move);
      const prevPrev = moves[moves.length - 2];
      if (prevPrev) {
        const prevPrevAxis = moveToAxis(prevPrev);
        // avoid triple moves on same axis (more "realistic" scrambles)
        if (prevPrevAxis === prevAxis && prevAxis === nextAxis) continue;
      }
    }

    moves.push(move);
  }
  return moves.join(' ');
}

export function generateScramble(event: CubeEvent) {
  if (event === '222') {
    // 2x2 uses only face turns; typical lengths 9-11
    return genMoves(['R', 'L', 'U', 'D', 'F', 'B'], 11);
  }
  if (event === '333') {
    return genMoves(['R', 'L', 'U', 'D', 'F', 'B'], 20);
  }
  if (event === '444') {
    // 4x4: include wide turns to better resemble official scrambles
    return genMoves(
      ['R', 'L', 'U', 'D', 'F', 'B', 'Rw', 'Lw', 'Uw', 'Dw', 'Fw', 'Bw'],
      40,
    );
  }

  // For now, show puzzles in UI but keep scrambles realistic for supported NxN only.
  // (We’ll add proper scramblers for mega/pyra/sq1/etc. next.)
  return 'Coming soon';
}

export function shouldAutoNextScramble(event: CubeEvent) {
  return event === '222' || event === '333' || event === '444';
}

