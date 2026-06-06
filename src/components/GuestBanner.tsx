export function GuestBanner() {
  return (
    <div className="border-b border-purple/20 bg-purple/10 px-3 py-2 md:px-5">
      <p className="mx-auto max-w-[1440px] text-center text-sm text-fg-muted">
        <span className="font-semibold text-fg">Guest mode</span> — times save
        on this device only. Use{' '}
        <span className="font-semibold text-purple-light">Sign up</span> in the
        header to sync everywhere.
      </p>
    </div>
  );
}
