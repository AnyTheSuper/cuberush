import type { Discipline } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Card } from './ui/Card';

const SOLVING_MODES: Array<{ id: Discipline; label: string; sub?: string }> = [
  { id: 'standard', label: 'Standard', sub: 'None' },
  { id: 'blind', label: 'Blind' },
  { id: 'oneHanded', label: 'One-handed' },
  { id: 'feet', label: 'Feet' },
];

const EXTRA_MODES: Array<{ id: Discipline; label: string }> = [
  { id: 'multi', label: 'Multi' },
  { id: 'other', label: 'Other' },
];

export function DisciplineBar() {
  const session = useAppStore((s) =>
    s.sessions.find((x) => x.id === s.currentSessionId),
  );
  const setDiscipline = useAppStore((s) => s.setDiscipline);
  const active = session?.discipline ?? 'standard';

  return (
    <Card className="mb-4" title="Discipline">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SOLVING_MODES.map((it) => (
            <DisciplineTile
              key={it.id}
              label={it.label}
              sub={it.sub}
              active={active === it.id}
              onClick={() => setDiscipline(it.id)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {EXTRA_MODES.map((it) => (
            <DisciplineTile
              key={it.id}
              label={it.label}
              active={active === it.id}
              onClick={() => setDiscipline(it.id)}
              compact
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function DisciplineTile({
  label,
  sub,
  active,
  onClick,
  compact,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex flex-col items-center justify-center rounded-xl border text-center transition ' +
        (compact ? 'px-2 py-3' : 'px-3 py-4 min-h-[72px]') +
        ' ' +
        (active
          ? 'border-purple/60 bg-purple/25 text-fg shadow-purple'
          : 'border-stroke bg-bg-panel2 text-fg-muted hover:border-purple/30 hover:text-fg')
      }
    >
      {sub && (
        <span className="text-lg font-bold text-fg-muted/80">{sub}</span>
      )}
      <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>
        {label}
      </span>
    </button>
  );
}
