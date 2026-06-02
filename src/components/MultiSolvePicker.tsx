import { useAppStore } from '../store/useAppStore';
import { PuzzleGrid } from './PuzzleGrid';

export function MultiSolvePicker({ onChanged }: { onChanged?: () => void }) {
  const multiSolve = useAppStore((s) => s.multiSolve);
  const toggleMultiSolveEvent = useAppStore((s) => s.toggleMultiSolveEvent);
  const selected = new Set(multiSolve.events);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.18em] text-fg-subtle uppercase">
          Multi cubes
        </span>
        <span className="text-xs text-fg-muted">
          {selected.size} selected · one solve each
        </span>
      </div>
      <PuzzleGrid
        mode="multi"
        selectedEvents={selected}
        onPick={(e) => {
          toggleMultiSolveEvent(e);
          onChanged?.();
        }}
        maxHeight="max-h-56"
      />
    </div>
  );
}
