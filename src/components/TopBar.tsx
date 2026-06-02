import { useEffect, useMemo, useState } from 'react';
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
  const setSettings = useAppStore((s) => s.setSettings);
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

  const [advancedOpen, setAdvancedOpen] = useState(settings.uiAdvancedOpen);
  useEffect(() => {
    setAdvancedOpen(settings.uiAdvancedOpen);
  }, [settings.uiAdvancedOpen]);

  const setAdvanced = (open: boolean) => {
    setAdvancedOpen(open);
    setSettings({ uiAdvancedOpen: open });
  };

  const handleChanged = () => {
    if (!settings.uiAutoCollapseAdvanced) return;
    setAdvanced(false);
  };

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

  const scramblePreview = useMemo(() => {
    const s = String(scramble ?? '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  }, [scramble]);

  return (
    <>
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
            {!advancedOpen && (
              <div
                className="max-w-[min(100%,28rem)] truncate rounded-lg border border-stroke/70 bg-bg-panel2 px-3 py-2 text-xs text-fg-muted"
                title={scramble}
              >
                {scramblePreview}
              </div>
            )}
            <Button variant="ghost" onClick={() => setAdvanced(!advancedOpen)}>
              {advancedOpen ? 'Close' : 'Change'}
            </Button>
            <Button variant="purple" onClick={nextScramble}>
              Next scramble
            </Button>
          </div>
        </div>

        {advancedOpen && (
          <div className="px-4 py-3">
            <div className="space-y-4">
              <DisciplineBar onChanged={handleChanged} />

              <Card title="Scramble">
                <div className="flex flex-col gap-4">
                  {multiMode ? (
                    <MultiSolvePicker onChanged={handleChanged} />
                  ) : (
                    <PuzzlePicker onChanged={handleChanged} />
                  )}

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
                  </div>

                  <div className="rounded-xl border border-purple/20 bg-bg-inset px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-fg">
                    {scramble}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
