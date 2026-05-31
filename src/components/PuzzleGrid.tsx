import type { CubeEvent } from '../types';
import { eventLabel, PUZZLE_CATEGORIES } from '../lib/events';

type PuzzleGridProps = {
  mode: 'single' | 'multi';
  /** Active event (single mode) */
  activeEvent?: CubeEvent;
  /** Selected events (multi mode) */
  selectedEvents?: Set<CubeEvent>;
  onPick: (event: CubeEvent) => void;
  maxHeight?: string;
};

export function PuzzleGrid({
  mode,
  activeEvent,
  selectedEvents,
  onPick,
  maxHeight = 'max-h-64',
}: PuzzleGridProps) {
  return (
    <div
      className={`${maxHeight} space-y-4 overflow-y-auto rounded-lg border border-purple/20 bg-bg-inset p-3 pr-2`}
    >
      {PUZZLE_CATEGORIES.map((category) => (
        <section key={category.title}>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-fg">
            {category.title}
          </h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {category.events.map((event) => {
              const active =
                mode === 'single'
                  ? activeEvent === event
                  : (selectedEvents?.has(event) ?? false);

              return (
                <button
                  key={event}
                  type="button"
                  onClick={() => onPick(event)}
                  title={eventLabel(event)}
                  className={
                    'flex aspect-square flex-col items-center justify-center rounded-lg border p-1 text-center transition ' +
                    (active
                      ? 'border-stat-yellow/80 bg-stat-yellow/10 text-stat-yellow shadow-yellow'
                      : 'border-stroke bg-bg-panel2 text-fg-muted hover:border-purple/40 hover:text-fg')
                  }
                >
                  <PuzzleIcon event={event} active={active} />
                  <span className="mt-1 w-full truncate px-0.5 text-[10px] font-semibold leading-tight">
                    {eventLabel(event)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Minimal CSTimer-style puzzle face icon */
function PuzzleIcon({ event, active }: { event: CubeEvent; active: boolean }) {
  const color = active ? '#facc15' : '#64748b';

  if (event === 'pyra') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <polygon
          points="14,4 24,22 4,22"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
        <line x1="14" y1="4" x2="14" y2="22" stroke={color} strokeWidth="1" />
        <line x1="9" y1="13" x2="19" y2="13" stroke={color} strokeWidth="1" />
      </svg>
    );
  }

  if (event === 'mega' || event === 'kilo') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <polygon
          points="14,3 25,10 21,24 7,24 3,10"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (event === 'skewb') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <rect
          x="6"
          y="6"
          width="16"
          height="16"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          transform="rotate(45 14 14)"
        />
      </svg>
    );
  }

  if (event === 'sq1') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <rect
          x="7"
          y="7"
          width="14"
          height="14"
          rx="7"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  // NxN cube grid
  const n = parseNxN(event);
  const cells = Math.min(n, 5);
  const pad = 4;
  const size = 28 - pad * 2;
  const step = size / cells;

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <rect
        x={pad}
        y={pad}
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        rx="2"
      />
      {Array.from({ length: cells - 1 }, (_, i) => (
        <g key={i}>
          <line
            x1={pad + step * (i + 1)}
            y1={pad}
            x2={pad + step * (i + 1)}
            y2={pad + size}
            stroke={color}
            strokeWidth="0.75"
          />
          <line
            x1={pad}
            y1={pad + step * (i + 1)}
            x2={pad + size}
            y2={pad + step * (i + 1)}
            stroke={color}
            strokeWidth="0.75"
          />
        </g>
      ))}
    </svg>
  );
}

function parseNxN(event: CubeEvent): number {
  const m = event.match(/^(\d+)$/);
  if (!m) return 3;
  const digits = m[1];
  if (digits.length >= 4) return parseInt(digits.slice(0, 2), 10);
  return parseInt(digits[0], 10);
}
