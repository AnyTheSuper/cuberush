import { useEffect, useMemo, useState } from 'react';
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
  const applySetup = useAppStore((s) => s.applySetup);
  const multiSolve = useAppStore((s) => s.multiSolve);

  const discipline: Discipline = session?.discipline ?? 'standard';
  const event: CubeEvent = session?.event ?? '333';

  const [draftDiscipline, setDraftDiscipline] = useState<Discipline>(discipline);
  const [draftEvent, setDraftEvent] = useState<CubeEvent>(event);
  const [draftMultiEvents, setDraftMultiEvents] = useState<CubeEvent[]>(
    multiSolve.events.length ? [...multiSolve.events] : ['333', '444', '555'],
  );

  // When opening, snapshot current session as the draft.
  useEffect(() => {
    if (!open) return;
    setDraftDiscipline(discipline);
    setDraftEvent(event);
    setDraftMultiEvents(
      multiSolve.events.length ? [...multiSolve.events] : ['333', '444', '555'],
    );
  }, [discipline, event, multiSolve.events, open]);

  const multiSelected = useMemo(
    () => new Set(draftMultiEvents),
    [draftMultiEvents],
  );

  const activeLabel = useMemo(() => {
    if (draftDiscipline === 'multi') {
      return `Multi · ${draftMultiEvents.length} cube${draftMultiEvents.length === 1 ? '' : 's'}`;
    }
    return `${disciplineLabel(draftDiscipline)} · ${eventLabel(draftEvent)}`;
  }, [draftDiscipline, draftEvent, draftMultiEvents.length]);

  const setAsDefault = () => {
    if (draftDiscipline === 'multi') {
      setSettings({
        defaultDiscipline: 'multi',
        defaultEvent: draftMultiEvents[0] ?? '333',
        defaultMultiEvents:
          draftMultiEvents.length > 0 ? [...draftMultiEvents] : ['333', '444', '555'],
      });
    } else {
      setSettings({
        defaultDiscipline: draftDiscipline,
        defaultEvent: draftEvent,
      });
    }
  };

  const toggleDraftMulti = (e: CubeEvent) => {
    setDraftMultiEvents((prev) => {
      const has = prev.includes(e);
      if (has) {
        if (prev.length <= 1) return prev;
        return prev.filter((x) => x !== e);
      }
      return [...prev, e];
    });
  };

  const handleDone = () => {
    if (draftDiscipline === 'multi') {
      const events = draftMultiEvents.length ? [...draftMultiEvents] : [draftEvent];
      applySetup({
        discipline: 'multi',
        event: events[0] ?? draftEvent,
        multiEvents: events,
      });
    } else {
      applySetup({ discipline: draftDiscipline, event: draftEvent });
    }
    onClose();
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
              const active = draftDiscipline === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDraftDiscipline(id)}
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

        {draftDiscipline !== 'multi' ? (
          <Card title="Cube">
            <PuzzleGrid
              mode="single"
              activeEvent={draftEvent}
              onPick={(e) => setDraftEvent(e)}
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
              onPick={toggleDraftMulti}
              maxHeight="max-h-72"
            />
          </Card>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleDone}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

