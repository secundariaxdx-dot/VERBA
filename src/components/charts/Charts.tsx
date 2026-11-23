"use client";
import { useState } from "react";
import type { Skill, SkillEstimate } from "@/domain/types";
import { SKILL_LABEL, bandFor, C1_THRESHOLD } from "@/engine/levels";

/**
 * Charts follow one rule set: a single burnt-orange hue for magnitude, thin
 * rounded marks anchored to the baseline, recessive axes, selective direct
 * labels and a hover tooltip on every mark.
 */

export function BarChart({ data, height = 160, unit = "min", highlight, goal }: { data: { label: string; value: number; key: string }[]; height?: number; unit?: string; highlight?: string; goal?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(goal ?? 0, ...data.map((d) => d.value), 1);
  const nice = Math.ceil(max / 15) * 15;
  const dense = data.length > 10;
  const gap = dense ? "gap-[3px]" : "gap-[6%]";
  const every = data.length > 20 ? 5 : data.length > 10 ? 2 : 1;
  return (
    <div className="relative" style={{ height: height + 28 }}>
      <div className="absolute inset-x-0 top-0" style={{ height }}>
        {[0.5, 1].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2.5 right-0 bg-card pl-1 text-[10px] text-faint tabular">{Math.round(nice * f)}</span>
          </div>
        ))}
        {goal ? (
          <div className="absolute inset-x-0 z-10 border-t border-accent/50" style={{ bottom: `${(goal / nice) * 100}%` }}>
            <span className="absolute -top-2.5 left-0 bg-card pr-1 text-[10px] font-medium text-accent-700">goal</span>
          </div>
        ) : null}
        <div className={`absolute inset-0 flex items-end pr-7 ${gap}`}>
          {data.map((d, i) => {
            const h = (d.value / nice) * 100;
            const isHi = d.key === highlight;
            return (
              <div
                key={d.key}
                className="relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label}: ${d.value} ${unit}`}
              >
                <div
                  className={`w-full max-w-[34px] rounded-t-[4px] transition-all duration-500 ${d.value === 0 ? "bg-sand" : isHi ? "bg-accent" : hover === i ? "bg-accent-600" : "bg-accent/55"}`}
                  style={{ height: d.value === 0 ? 3 : `${Math.max(h, 2)}%` }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute -top-9 z-20 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] text-card shadow">
                    {d.label}: <span className="tabular font-semibold">{d.value}</span> {unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className={`absolute inset-x-0 bottom-0 flex pr-7 ${gap}`}>
        {data.map((d, i) => (
          <div key={d.key} className={`min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[11px] ${d.key === highlight ? "font-semibold text-ink" : "text-muted"}`}>
            {i % every === 0 || d.key === highlight ? d.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ points, height = 180, min, max, refLine, refLabel, format = (v: number) => String(Math.round(v)) }: { points: { x: string; y: number; label?: string }[]; height?: number; min?: number; max?: number; refLine?: number; refLabel?: string; format?: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = height;
  const pad = { l: 8, r: 36, t: 14, b: 22 };
  if (points.length === 0) return <div className="grid place-items-center text-sm text-muted" style={{ height }}>No data yet</div>;
  const ys = points.map((p) => p.y);
  const lo = min ?? Math.floor(Math.min(...ys, refLine ?? Infinity) - 3);
  const hi = max ?? Math.ceil(Math.max(...ys, refLine ?? -Infinity) + 3);
  const sx = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const sy = (v: number) => pad.t + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const area = `${d} L${sx(points.length - 1)},${H - pad.b} L${sx(0)},${H - pad.b} Z`;
  const last = points[points.length - 1];
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((x - pad.l) / (W - pad.l - pad.r)) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, i)));
        }}
        role="img"
        aria-label={`Trend, latest ${format(last.y)}`}
      >
        <defs>
          <linearGradient id="verba-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} stroke="var(--color-line)" strokeDasharray="3 4" />
            <text x={W - pad.r + 6} y={sy(t) + 3} fontSize="10" fill="var(--color-faint)">
              {format(t)}
            </text>
          </g>
        ))}
        {refLine !== undefined && refLine >= lo && refLine <= hi && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={sy(refLine)} y2={sy(refLine)} stroke="var(--color-ok)" strokeWidth="1.5" strokeDasharray="6 4" />
            <text x={pad.l + 4} y={sy(refLine) - 5} fontSize="10.5" fontWeight="600" fill="var(--color-ok)">
              {refLabel}
            </text>
          </g>
        )}
        <path d={area} fill="url(#verba-area)" />
        <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={sx(points.length - 1)} cy={sy(last.y)} r="4.5" fill="var(--color-accent)" stroke="var(--color-card)" strokeWidth="2" />
        {hover !== null && (
          <g>
            <line x1={sx(hover)} x2={sx(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--color-ink-2)" strokeOpacity="0.35" />
            <circle cx={sx(hover)} cy={sy(points[hover].y)} r="5" fill="var(--color-card)" stroke="var(--color-accent)" strokeWidth="2" />
          </g>
        )}
        <text x={pad.l} y={H - 4} fontSize="10" fill="var(--color-faint)">
          {points[0].label ?? points[0].x}
        </text>
        <text x={W - pad.r} y={H - 4} fontSize="10" fill="var(--color-faint)" textAnchor="end">
          {last.label ?? last.x}
        </text>
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 rounded-lg bg-ink px-2 py-1 text-[11px] text-card shadow" style={{ left: `clamp(0px, calc(${(sx(hover) / W) * 100}% - 40px), calc(100% - 110px))` }}>
          {points[hover].label ?? points[hover].x}: <span className="font-semibold tabular">{format(points[hover].y)}</span>
        </div>
      )}
    </div>
  );
}

/** Horizontal skill bars on the 150–200 scale with a C1 marker. */
export function SkillBars({ levels, compact = false }: { levels: Record<Skill, SkillEstimate>; compact?: boolean }) {
  const [hover, setHover] = useState<Skill | null>(null);
  const lo = 150;
  const hi = 200;
  const pct = (v: number) => Math.max(2, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  const c1 = pct(C1_THRESHOLD);
  const skills = Object.keys(levels) as Skill[];
  return (
    <div className="space-y-3">
      {skills.map((s) => {
        const e = levels[s];
        const b = bandFor(e.score);
        return (
          <div key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)} className="group">
            <div className="mb-1 flex items-baseline justify-between text-[13px]">
              <span className="text-ink-2">{SKILL_LABEL[s]}</span>
              <span className="tabular font-medium text-ink">
                {b.short}
                {!compact && <span className="ml-1.5 text-[11px] font-normal text-faint">{Math.round(e.score)}</span>}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-sand">
              <div className={`h-full rounded-full transition-all duration-700 ${e.score >= C1_THRESHOLD ? "bg-ok" : "bg-accent"} ${hover && hover !== s ? "opacity-50" : ""}`} style={{ width: `${pct(e.score)}%` }} />
              <div className="absolute -top-1 h-4 w-px bg-ink/40" style={{ left: `${c1}%` }} aria-hidden />
            </div>
          </div>
        );
      })}
      <div className="relative h-4 text-[10.5px] text-faint">
        <span className="absolute left-0">B2</span>
        <span className="absolute -translate-x-1/2 font-medium text-ink-2" style={{ left: `${c1}%` }}>
          C1 ▲
        </span>
        <span className="absolute right-0">C2</span>
      </div>
    </div>
  );
}

/** Calendar heatmap of study minutes (single hue, light → dark). */
export function Heatmap({ days }: { days: { date: string; minutes: number }[] }) {
  const max = Math.max(30, ...days.map((d) => d.minutes));
  const shade = (m: number) => (m === 0 ? "var(--color-sand)" : `color-mix(in oklab, var(--color-accent) ${Math.round(25 + (m / max) * 75)}%, var(--color-card))`);
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridAutoColumns: "minmax(0,1fr)" }}>
      {days.map((d) => (
        <div key={d.date} title={`${d.date}: ${d.minutes} min`} className="aspect-square rounded-[3px]" style={{ background: shade(d.minutes) }} />
      ))}
    </div>
  );
}
