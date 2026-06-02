import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from './ui/Card';

export function SetupCard() {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );

  const solves = session?.solves ?? [];
  const attempts = solves.length;

  const subtitle = useMemo(() => {
    if (!session) return '';
    return `${attempts} attempt${attempts === 1 ? '' : 's'}`;
  }, [attempts, session]);

  return (
    <Card
      title="Setup"
      right={<span className="text-xs text-fg-muted">{subtitle}</span>}
      className="h-full"
    >
      <div className="space-y-2">
        <div className="rounded-lg border border-purple/25 bg-purple/10 px-3 py-2">
          <div className="text-xs font-semibold tracking-[0.2em] text-fg-subtle">
            CURRENT
          </div>
          <div className="mt-1 truncate text-base font-semibold text-fg">
            {session?.name ?? '—'}
          </div>
        </div>
        <p className="text-xs text-fg-subtle">
          Setups are auto-created from your selected mode and cube. Use
          Customize to switch setups.
        </p>
      </div>
    </Card>
  );
}

