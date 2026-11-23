/** VERBA mark: a V whose right stroke rises past the left — a path that keeps going up. */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--color-accent)" />
      <path d="M16 19 L29.5 46 L48 13" fill="none" stroke="var(--color-card)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="13" r="3.6" fill="var(--color-card)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={30} />
      <span className="font-display text-[1.35rem] font-semibold tracking-[0.18em] text-ink">VERBA</span>
    </span>
  );
}
