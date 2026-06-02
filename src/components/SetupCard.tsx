import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from './ui/Card';

export function SetupCard() {
  const sessions = useAppStore((s) => s.sessions);
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const switchSession = useAppStore((s) => s.switchSession);

  const items = useMemo(
    () => [...sessions].sort((a, b) => b.createdAt - a.createdAt),
    [sessions],
  );

  return (
    <Card
      title="Sessions"
      right={<span className="text-xs text-fg-muted">{items.length}</span>}
      className="h-full"
    >
      <div className="flex flex-col gap-1">
        {items.map((s) => {
          const active = s.id === currentSessionId;
          const attempts = s.solves.length;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => switchSession(s.id)}
              className={
                'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ' +
                (active
                  ? 'border-purple/60 bg-purple/25 text-fg shadow-purple'
                  : 'border-stroke/60 bg-bg-panel2 text-fg-muted hover:border-purple/30 hover:bg-purple/10 hover:text-fg')
              }
              title={s.name}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {s.name}
              </span>
              <span className="shrink-0 rounded-md border border-stroke/60 bg-white/[0.04] px-2 py-1 text-xs text-fg-muted">
                {attempts}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

