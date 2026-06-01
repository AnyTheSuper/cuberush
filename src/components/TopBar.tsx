import { useMemo } from 'react';
import {
  disciplineLabel,
  eventLabel,
  isMultiComplete,
  multiSolveEventAt,
  multiSolveTotal,
} from '../lib/events';
import { getInspectionLimits } from '../lib/inspection';
import { useAppStore } from '../store/useAppStore';
import { DisciplineBar } from './DisciplineBar';
import { MultiSolvePicker } from './MultiSolvePicker';
import { PuzzlePicker } from './PuzzlePicker';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

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
  const statusText = multiMode
    ? complete
      ? 'Done'
      : progress
    : eventLabel(event);

  return (
    <>
      <DisciplineBar />

      <Card className="mb-4" title="Scramble">
        <div className="flex flex-col gap-4">
          {multiMode ? <MultiSolvePicker /> : <PuzzlePicker />}

          {inspectionHint && (
            <div className="rounded-lg border border-stat-green/40 bg-stat-green/10 px-3 py-2 text-xs text-stat-green">
              {inspectionHint}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
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

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div
                className={
                  'max-w-[min(100%,32rem)] rounded-lg border px-3 py-2 text-sm ' +
                  (multiMode && complete
                    ? 'border-stat-green/40 bg-stat-green/10 text-stat-green'
                    : 'border-stroke/70 bg-bg-panel2 text-fg-muted')
                }
                title={
                  multiMode
                    ? 'One solve per selected cube'
                    : `${statusLabel} · ${statusText}`
                }
              >
                {statusLabel}:{' '}
                <span
                  className={
                    multiMode && complete ? 'font-semibold' : 'text-fg'
                  }
                >
                  {statusText}
                </span>
              </div>
              <Button variant="purple" onClick={nextScramble}>
                Next scramble
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-purple/20 bg-bg-inset px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-fg">
            {scramble}
          </div>
        </div>
      </Card>
    </>
  );
}
