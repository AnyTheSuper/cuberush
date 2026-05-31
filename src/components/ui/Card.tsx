import type { ReactNode } from 'react';

export function Card({
  title,
  right,
  children,
  className = '',
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        'rounded-xl2 border border-purple/20 bg-bg-panel shadow-panel ' +
        className
      }
    >
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-purple/15 px-4 py-3">
          <div className="text-sm font-semibold text-fg">{title}</div>
          <div className="shrink-0">{right}</div>
        </header>
      )}
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}
