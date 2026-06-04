import { formatMs } from '../../lib/time';
import type { RaceOpponent } from '../../lib/race/types';

export function RaceOpponentCard({
  opponent,
  highlight,
  liveMs,
  finished,
}: {
  opponent: RaceOpponent;
  highlight?: boolean;
  liveMs?: number | null;
  finished?: boolean;
}) {
  const record = `${opponent.wins}W · ${opponent.losses}L`;

  return (
    <div
      className={
        'rounded-xl2 border px-4 py-3 ' +
        (highlight
          ? 'border-stat-yellow/50 bg-stat-yellow/10 shadow-yellow'
          : 'border-purple/25 bg-bg-panel2')
      }
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-purple/30 bg-bg-inset text-2xl">
          {opponent.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-fg">{opponent.username}</div>
          <div className="text-xs text-fg-muted">
            Rating <span className="font-mono text-purple-light">{opponent.rating}</span>
            {' · '}
            {record}
          </div>
        </div>
        {liveMs != null && (
          <div className="text-right">
            <div className="text-[10px] font-semibold tracking-wider text-fg-subtle">
              {finished ? 'FINISH' : 'SOLVING'}
            </div>
            <div className="font-mono text-lg font-semibold tabular-nums text-fg">
              {formatMs(liveMs)}
            </div>
          </div>
        )}
      </div>
      {opponent.recentTimesMs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {opponent.recentTimesMs.slice(0, 5).map((t, i) => (
            <span
              key={i}
              className="rounded-md border border-purple/20 bg-purple/10 px-2 py-0.5 font-mono text-[10px] text-fg-muted"
            >
              {formatMs(t)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
