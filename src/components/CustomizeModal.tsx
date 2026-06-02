import { useMemo } from 'react';
import type { CubeEvent, Discipline } from '../types';
import { disciplineLabel, eventLabel } from '../lib/events';
import { useAppStore } from '../store/useAppStore';
import { Modal } from './ui/Modal';
import { PuzzleGrid } from './PuzzleGrid';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export function CustomizeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const setSettings = useAppStore((s) => s.setSettings);
  const setEvent = useAppStore((s) => s.setEvent);
  const setDiscipline = useAppStore((s) => s.setDiscipline);
  const multiSolve = useAppStore((s) => s.multiSolve);
  const toggleMultiSolveEvent = useAppStore((s) => s.toggleMultiSolveEvent);

  const discipline: Discipline = session?.discipline ?? 'standard';
  const event: CubeEvent = session?.event ?? '333';
  const multiSelected = useMemo(() => new Set(multiSolve.events), [multiSolve.events]);

  const activeLabel = useMemo(() => {
    if (discipline === 'multi') {
      return `Multi · ${multiSolve.events.length} cube${multiSolve.events.length === 1 ? '' : 's'}`;
    }
    return `${disciplineLabel(discipline)} · ${eventLabel(event)}`;
  }, [discipline, event, multiSolve.events.length]);

  const setAsDefault = () => {
    if (discipline === 'multi') {
      setSettings({
        defaultDiscipline: 'multi',
        defaultEvent: multiSolve.events[0] ?? '333',
        defaultMultiEvents:
          multiSolve.events.length > 0 ? [...multiSolve.events] : ['333', '444', '555'],
      });
    } else {
      setSettings({
        defaultDiscipline: discipline,
        defaultEvent: event,
      });
    }
  };

  return (
    <Modal open={open} title="Customize" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-fg-muted">
            Current setup:{' '}
            <span className="font-semibold text-fg">{activeLabel}</span>
          </div>
          <Button type="button" variant="purple" onClick={setAsDefault}>
            Make default
          </Button>
        </div>

        <Card title="Mode">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ['standard', 'Standard'],
                ['blind', 'Blind'],
                ['oneHanded', 'One-Handed'],
                ['feet', 'Feet'],
                ['multi', 'Multi'],
                ['other', 'Other'],
              ] as const
            ).map(([id, label]) => {
              const active = discipline === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDiscipline(id)}
                  className={
                    'rounded-xl border px-3 py-3 text-sm font-semibold transition ' +
                    (active
                      ? 'border-purple/60 bg-purple/25 text-fg shadow-purple'
                      : 'border-stroke bg-bg-panel2 text-fg-muted hover:border-purple/30 hover:text-fg')
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Card>

        {discipline !== 'multi' ? (
          <Card title="Cube">
            <PuzzleGrid
              mode="single"
              activeEvent={event}
              onPick={(e) => setEvent(e)}
              maxHeight="max-h-72"
            />
          </Card>
        ) : (
          <Card
            title="Multi cubes"
            right={
              <span className="text-xs text-fg-muted">
                {multiSelected.size} selected
              </span>
            }
          >
            <PuzzleGrid
              mode="multi"
              selectedEvents={multiSelected}
              onPick={toggleMultiSolveEvent}
              maxHeight="max-h-72"
            />
          </Card>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

