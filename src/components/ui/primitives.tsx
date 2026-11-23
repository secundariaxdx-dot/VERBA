"use client";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { boldSegments } from "@/lib/text";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "quiet" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-card hover:bg-accent-600 shadow-[0_1px_0_rgb(255_255_255/0.2)_inset,0_6px_16px_-8px_rgb(198_93_50/0.7)]",
  secondary: "bg-card text-ink border border-line hover:border-line-2 hover:bg-paper",
  ghost: "text-ink-2 hover:bg-sand",
  quiet: "bg-sand text-ink hover:bg-sand-2",
  danger: "bg-bad-50 text-bad hover:bg-bad hover:text-card",
};
const SIZES = { sm: "h-8 px-3 text-[13px] gap-1.5", md: "h-10 px-4 text-sm gap-2", lg: "h-12 px-6 text-[15px] gap-2" };

export function Button({ variant = "primary", size = "md", className, ...p }: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex select-none items-center justify-center rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    />
  );
}

export function ButtonLink({ variant = "primary", size = "md", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <Link {...p} className={cx("inline-flex select-none items-center justify-center rounded-full font-medium transition-colors", VARIANTS[variant], SIZES[size], className)} />;
}

export function Card({ className, ...p }: ComponentProps<"div">) {
  return <div {...p} className={cx("rounded-[var(--radius-card)] border border-line/70 bg-card shadow-[var(--shadow-soft)]", className)} />;
}

export function CardHeader({ eyebrow, title, action, className }: { eyebrow?: string; title?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        {title && <h3 className="text-lg font-semibold leading-snug text-ink">{title}</h3>}
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "accent" | "ok" | "bad" | "gold" | "outline";
const TONES: Record<Tone, string> = {
  neutral: "bg-sand text-ink-2",
  accent: "bg-accent-50 text-accent-700",
  ok: "bg-ok-50 text-ok",
  bad: "bg-bad-50 text-bad",
  gold: "bg-gold-50 text-gold",
  outline: "border border-line text-ink-2",
};
export function Badge({ tone = "neutral", className, ...p }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span {...p} className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", TONES[tone], className)} />;
}

export function ProgressBar({ value, max = 100, className, tone = "accent", label }: { value: number; max?: number; className?: string; tone?: "accent" | "ok" | "ink"; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === "ok" ? "bg-ok" : tone === "ink" ? "bg-ink" : "bg-accent";
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-sand", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, size = 120, stroke = 10, children, label }: { value: number; size?: number; stroke?: number; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(pct)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sand)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="text-[2rem] font-medium leading-[1.1] text-ink sm:text-[2.4rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string }) {
  return (
    <div className={cx("inline-flex rounded-full bg-sand p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", value === o.value ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cx("min-w-0", className)}>
      <div className="eyebrow mb-1.5">{label}</div>
      <div className="tabular font-display text-[1.75rem] font-medium leading-none text-ink">{value}</div>
      {hint && <div className="mt-1.5 text-[12.5px] text-muted">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-2 bg-paper/50 px-6 py-10 text-center">
      <div className="font-display text-lg text-ink">{title}</div>
      {children && <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Renders text with **bold** and line breaks. */
export function Rich({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split("\n").map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {boldSegments(line).map((s, j) => (s.bold ? <strong key={j} className="font-semibold text-ink">{s.text}</strong> : <span key={j}>{s.text}</span>))}
        </span>
      ))}
    </span>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls = "h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-[15px] text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function Chip({ active, className, ...p }: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
        active ? "border-ink bg-ink text-card" : "border-line bg-card text-ink-2 hover:border-line-2",
        className,
      )}
    />
  );
}
