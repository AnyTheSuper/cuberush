import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export function SessionsPanel() {
  const sessions = useAppStore((s) => s.sessions);
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const createSession = useAppStore((s) => s.createSession);
  const switchSession = useAppStore((s) => s.switchSession);
  const deleteSession = useAppStore((s) => s.deleteSession);

  const items = useMemo(() => sessions, [sessions]);
  const canDelete = sessions.length > 1;

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    deleteSession(id);
  };

  return (
    <Card
      title="Sessions"
      right={
        <Button variant="purple" onClick={() => createSession()}>
          + New
        </Button>
      }
      className="h-full"
    >
      <div className="flex flex-col gap-1">
        {items.map((s) => {
          const active = s.id === currentSessionId;
          return (
            <div
              key={s.id}
              className={
                'flex items-center gap-1 rounded-lg transition ' +
                (active
                  ? 'border border-purple/50 bg-purple/25 shadow-purple'
                  : 'border border-transparent hover:border-purple/20 hover:bg-bg-panel2')
              }
            >
              <button
                type="button"
                className={
                  'min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left text-sm ' +
                  (active ? 'text-fg' : 'text-fg-muted hover:text-fg')
                }
                onClick={() => switchSession(s.id)}
              >
                <span className="truncate font-medium">{s.name}</span>
              </button>
              <button
                type="button"
                className={
                  'mr-1 shrink-0 rounded-md border px-2 py-1 text-xs transition ' +
                  (canDelete
                    ? 'border-stroke/80 text-fg-muted hover:border-bad/50 hover:bg-bad/15 hover:text-bad'
                    : 'cursor-not-allowed border-stroke/40 text-fg-subtle opacity-50')
                }
                title={
                  canDelete
                    ? `Delete ${s.name}`
                    : 'Create another session before deleting this one'
                }
                aria-label={`Delete ${s.name}`}
                disabled={!canDelete}
                onClick={() => handleDelete(s.id)}
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
