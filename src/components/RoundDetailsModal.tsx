import type { Solve } from '../types';
import { eventLabel } from '../lib/events';
import { formatSolveTime, roundTotalMs } from '../lib/stats';
import { formatMs } from '../lib/time';
import { Modal } from './ui/Modal';

export function RoundDetailsModal({
  open,
  roundLabel,
  solves,
  onClose,
}: {
  open: boolean;
  roundLabel: string;
  solves: Solve[];
  onClose: () => void;
}) {
  const total = roundTotalMs(solves, solves.length);
  const ordered = [...solves].reverse();

  return (
    <Modal open={open} title={`${roundLabel} — cube times`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-stroke/80 bg-bg-panel2 px-4 py-3">
          <div className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">
            Round time
          </div>
          <div
            className={
              'mt-1 font-mono text-3xl font-semibold tabular-nums ' +
              (total == null ? 'text-bad' : 'text-good')
            }
          >
            {total == null ? 'DNF' : formatMs(total)}
          </div>
        </div>

        <ul className="space-y-2">
          {ordered.map((solve, i) => (
            <li
              key={solve.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stroke/60 bg-white/[0.03] px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-xs font-semibold text-fg-subtle">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-fg">
                  {eventLabel(solve.event)}
                </span>
              </div>
              <span
                className={
                  'font-mono text-base font-semibold tabular-nums ' +
                  (solve.penalty === 'DNF'
                    ? 'text-bad'
                    : solve.penalty === '+2'
                      ? 'text-warn'
                      : 'text-fg')
                }
              >
                {formatSolveTime(solve)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
