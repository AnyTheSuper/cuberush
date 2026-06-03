import type { ReactNode } from 'react';

export function Card({
  title,
  right,
  children,
  className = '',
  scrollable = false,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  /** When true, body scrolls inside a max-height parent (e.g. modals). */
  scrollable?: boolean;
}) {
  return (
    <section
      className={
        'rounded-xl2 border border-purple/20 bg-bg-panel shadow-panel ' +
        (scrollable ? 'flex min-h-0 flex-col ' : '') +
        className
      }
    >
      {(title || right) && (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-purple/15 px-4 py-3">
          <div className="text-sm font-semibold text-fg">{title}</div>
          <div className="shrink-0">{right}</div>
        </header>
      )}
      <div
        className={
          'px-4 py-3 ' +
          (scrollable
            ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4'
            : '')
        }
      >
        {children}
      </div>
    </section>
  );
}
