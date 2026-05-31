import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({
  variant = 'primary',
  left,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'purple';
  left?: ReactNode;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ' +
    'disabled:cursor-not-allowed disabled:opacity-60';
  const styles =
    variant === 'primary' || variant === 'purple'
      ? 'bg-btn-purple text-white shadow-purple hover:brightness-110'
      : variant === 'danger'
        ? 'border border-bad/40 bg-bad/15 text-bad hover:bg-bad/25'
        : 'border border-stroke bg-bg-panel2 text-fg-muted hover:border-purple/40 hover:text-fg';

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {left}
      {props.children}
    </button>
  );
}
