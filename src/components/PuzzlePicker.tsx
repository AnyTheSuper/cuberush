import type { CubeEvent } from '../types';
import { useAppStore } from '../store/useAppStore';
import { PuzzleGrid } from './PuzzleGrid';

export function PuzzlePicker() {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const setEvent = useAppStore((s) => s.setEvent);
  const event = session?.event ?? '333';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.18em] text-fg-subtle uppercase">
          Puzzle
        </span>
        <span className="text-xs text-fg-muted">Tap a cube to select</span>
      </div>
      <PuzzleGrid
        mode="single"
        activeEvent={event}
        onPick={(e) => setEvent(e as CubeEvent)}
      />
    </div>
  );
}
