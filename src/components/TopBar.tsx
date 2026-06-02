import { useMemo, useState } from 'react';
import {
  disciplineLabel,
  eventLabel,
  isMultiComplete,
  multiSolveEventAt,
  multiSolveTotal,
} from '../lib/events';
import { getInspectionLimits } from '../lib/inspection';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { CustomizeModal } from './CustomizeModal';

export function TopBar() {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const settings = useAppStore((s) => s.settings);
  const scrambleByEvent = useAppStore((s) => s.scrambleByEvent);
  const nextScramble = useAppStore((s) => s.nextScramble);
  const multiSolve = useAppStore((s) => s.multiSolve);

  const event = session?.event ?? '333';
  const discipline = session?.discipline ?? 'standard';
  const scramble = scrambleByEvent[event] ?? '';
  const multiMode =
    discipline === 'multi' || multiSolve.events.length > 1;
  const complete = isMultiComplete(multiSolve);
  const total = multiSolveTotal(multiSolve.events);
  const currentMultiEvent = multiSolveEventAt(
    multiSolve.events,
    multiSolve.index,
  );

  const [customizeOpen, setCustomizeOpen] = useState(false);

  const inspectionHint = useMemo(() => {
    const limits = getInspectionLimits(settings, multiSolve.events.length);
    const sec = limits.limitMs / 1000;
    if (!settings.inspectionEnabled) return null;
    if (multiMode) {
      return `${sec}s inspection (${settings.inspectionSeconds}s + ${multiSolve.events.length - 1}×${settings.inspectionBonusPerCubeSeconds}s)`;
    }
    return `${sec}s inspection`;
  }, [multiMode, multiSolve.events.length, settings]);

  const progress = useMemo(() => {
    if (complete) return `Done — ${total}/${total} cubes`;
    const cube = eventLabel(currentMultiEvent);
    const order = multiSolve.events.map(eventLabel).join(' → ');
    return multiMode
      ? `${multiSolve.index + 1}/${total} · ${cube} · ${order}`
      : `${eventLabel(event)}`;
  }, [
    complete,
    currentMultiEvent,
    event,
    multiMode,
    multiSolve.events,
    multiSolve.index,
    total,
  ]);

  const statusLabel = multiMode ? 'Multi' : disciplineLabel(discipline);

  return (
    <>
      <CustomizeModal open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      <div className="mb-4 rounded-xl2 border border-purple/25 bg-bg-panel shadow-panel">
        <div className="flex flex-wrap items-center gap-2 border-b border-purple/15 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-[0.2em] text-fg-subtle">
              MODE & PUZZLE
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-fg">{statusLabel}</span>
              <span className="text-fg-muted">·</span>
              <span className="text-fg">
                {multiMode ? (complete ? 'Done' : progress) : eventLabel(event)}
              </span>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setCustomizeOpen(true)}>
              Customize
            </Button>
            <Button variant="purple" onClick={nextScramble}>
              Next scramble
            </Button>
          </div>
        </div>

        <div className="px-4 py-3">
          {inspectionHint && (
            <div className="rounded-lg border border-stat-green/40 bg-stat-green/10 px-3 py-2 text-xs text-stat-green">
              {inspectionHint}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {multiMode && !complete && (
              <div className="rounded-lg border border-stat-yellow/40 bg-stat-yellow/10 px-3 py-2 text-sm text-stat-yellow">
                Now solving:{' '}
                <span className="font-semibold">
                  {eventLabel(currentMultiEvent)}
                </span>
              </div>
            )}
            {multiMode && complete && (
              <div className="rounded-lg border border-stat-blue/40 bg-stat-blue/10 px-3 py-2 text-sm text-stat-blue">
                Round complete — press Space or click the timer to start again
              </div>
            )}
          </div>

          <div className="rounded-xl border border-purple/20 bg-bg-inset px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-fg">
            {scramble}
          </div>
        </div>
      </div>
    </>
  );
}
