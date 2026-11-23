"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Flag, Info, RotateCcw, SkipForward } from "lucide-react";
import type { PlanBlock } from "@/domain/types";
import { useVerba, snapshot } from "@/store/verba";
import { milestones, skillGoals, weekPlan, weeksToExam } from "@/engine/planner";
import { SKILL_LABEL, bandFor } from "@/engine/levels";
import { overallScore } from "@/engine/adaptive";
import { Badge, Button, Card, CardHeader, Chip, Field, PageHeader, ProgressBar, inputCls, cx } from "@/components/ui/primitives";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, addDays, formatShort, parseISO, todayISO } from "@/lib/dates";

const KIND_LABEL: Record<PlanBlock["kind"], string> = {
  lesson: "New material",
  practice: "Weak areas",
  review: "Review",
  vocabulary: "New material",
  maintenance: "Maintenance",
  exam: "Exam simulation",
  writing: "Weak areas",
  speaking: "Weak areas",
  listening: "Weak areas",
  reading: "Weak areas",
};

const KIND_DOT: Record<string, string> = { "New material": "bg-accent", "Weak areas": "bg-bad/70", Review: "bg-gold", Maintenance: "bg-ok", "Exam simulation": "bg-ink" };

export default function PlanPage() {
  const state = useVerba();
  const data = useMemo(() => snapshot(), [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const [offset, setOffset] = useState(0);
  const today = todayISO();
  const anchor = addDays(today, offset * 7);
  const week = weekPlan(data, anchor);
  const ms = milestones(data);
  const goals = skillGoals(data);
  const profile = state.profile!;
  const score = overallScore(state.levels);

  const balance = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of week) for (const b of d.blocks) m.set(KIND_LABEL[b.kind], (m.get(KIND_LABEL[b.kind]) ?? 0) + b.minutes);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [week]);
  const weekTotal = balance.reduce((s, x) => s + x[1], 0);

  return (
    <div>
      <PageHeader
        eyebrow="My study plan"
        title={profile.examDate ? `${weeksToExam(data)} weeks to exam day` : "Your C1 preparation plan"}
        subtitle="Rebuilt every day from your diagnostic, mistakes, available time and progress. Mark blocks as done or skip them — the plan adapts."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
        <div className="min-w-0 space-y-6">
          {/* Week */}
          <Card className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="eyebrow mb-1">{offset === 0 ? "This week" : offset > 0 ? `In ${offset} week${offset > 1 ? "s" : ""}` : `${-offset} week${offset < -1 ? "s" : ""} ago`}</div>
                <h3 className="text-lg text-ink">
                  {formatShort(week[0].date)} – {formatShort(week[6].date)}
                </h3>
              </div>
              <div className="flex gap-1">
                <Button variant="secondary" size="sm" onClick={() => setOffset(offset - 1)} aria-label="Previous week">
                  <ChevronLeft size={16} />
                </Button>
                {offset !== 0 && (
                  <Button variant="secondary" size="sm" onClick={() => setOffset(0)}>
                    Today
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setOffset(offset + 1)} aria-label="Next week">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {week.map((d) => (
                <DayRow key={d.date} date={d.date} blocks={d.blocks} isStudyDay={d.isStudyDay} minutes={d.minutes} today={today} />
              ))}
            </div>
            <p className="mt-4 flex items-start gap-1.5 text-[12px] text-muted">
              <Info size={13} className="mt-0.5 shrink-0" /> Future days are projections: the exact lesson and practice topics are recalculated each morning from your latest results.
            </p>
          </Card>

          {/* Milestones */}
          <Card className="p-6">
            <CardHeader eyebrow="Monthly milestones" title={`From ${bandFor(score).label} today to C1${profile.examDate ? ` by ${formatShort(profile.examDate)}` : ""}`} />
            <ol className="relative space-y-5 border-l-2 border-line pl-6">
              {ms.map((m) => (
                <li key={m.date} className="relative">
                  <span className={cx("absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border-2", m.reached ? "border-ok bg-ok" : "border-accent bg-card")}>{m.reached && <Check size={10} className="text-card" />}</span>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-[16px] text-ink">{m.month}</span>
                    <Badge tone="neutral">{m.phase}</Badge>
                    <span className="text-[13px] text-muted">Target: {m.title}</span>
                  </div>
                  <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
                    {m.focus.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[12px] text-muted">Targets use VERBA’s unofficial estimate on the Cambridge English Scale. 180 is the C1 threshold.</p>
          </Card>

          {/* Skill goals */}
          <Card className="p-6">
            <CardHeader eyebrow="Skill goals" title="What each skill needs" />
            <ul className="divide-y divide-line">
              {goals.map((g) => (
                <li key={g.skill} className="grid gap-2 py-3 sm:grid-cols-[150px_1fr_1.4fr] sm:items-center sm:gap-4">
                  <span className="text-[14px] font-medium text-ink">{SKILL_LABEL[g.skill]}</span>
                  <div>
                    <div className="mb-1 flex justify-between text-[12px] text-muted">
                      <span>
                        {bandFor(g.current).short} ({g.current})
                      </span>
                      <span>
                        → {bandFor(g.target).short} ({g.target})
                      </span>
                    </div>
                    <ProgressBar value={g.current - 150} max={g.target - 150} tone={g.current >= g.target ? "ok" : "accent"} />
                  </div>
                  <span className="text-[13px] text-ink-2">{g.action}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <ScheduleEditor />
          <Card className="p-6">
            <CardHeader eyebrow="This week’s balance" title={`${weekTotal} planned minutes`} />
            <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-sand">
              {balance.map(([k, v]) => (
                <div key={k} className={cx("h-full border-r-2 border-card last:border-0", KIND_DOT[k])} style={{ width: `${(v / Math.max(1, weekTotal)) * 100}%` }} title={`${k}: ${v} min`} />
              ))}
            </div>
            <ul className="space-y-1.5 text-[13px]">
              {balance.map(([k, v]) => (
                <li key={k} className="flex items-center gap-2">
                  <span className={cx("h-2.5 w-2.5 rounded-full", KIND_DOT[k])} />
                  <span className="flex-1 text-ink-2">{k}</span>
                  <span className="tabular text-ink">{v} min</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[12px] leading-relaxed text-muted">Review comes first each day; weak skills appear about three times as often as strong ones; skills already at C1 only get maintenance; one exam simulation a week.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

const NONE: string[] = [];

function DayRow({ date, blocks, isStudyDay, minutes, today }: { date: string; blocks: PlanBlock[]; isStudyDay: boolean; minutes: number; today: string }) {
  const done = useVerba((s) => s.plan.done[date]) ?? NONE;
  const skipped = useVerba((s) => s.plan.skipped[date]) ?? NONE;
  const markBlock = useVerba((s) => s.markBlock);
  const dow = parseISO(date).getDay();
  const isToday = date === today;
  const past = date < today;
  return (
    <div className={cx("rounded-2xl border p-3.5 sm:p-4", isToday ? "border-accent/50 bg-accent-50/40" : "border-line/70 bg-paper/60", past && "opacity-75")}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[16px] text-ink">
            <span className="sm:hidden">{WEEKDAYS_SHORT[dow]}</span>
            <span className="hidden sm:inline">{WEEKDAYS_LONG[dow]}</span>
          </span>
          <span className="text-[12px] text-muted">{formatShort(date)}</span>
          {isToday && <Badge tone="accent">Today</Badge>}
        </div>
        <span className="tabular text-[12px] text-muted">{isStudyDay ? `${minutes} min` : "Rest day"}</span>
      </div>
      {isStudyDay && (
        <ul className="space-y-1.5">
          {blocks.map((b) => {
            const isDone = done.includes(b.id);
            const isSkipped = skipped.includes(b.id);
            return (
              <li key={b.id} className="group flex items-center gap-2.5 rounded-xl bg-card px-3 py-2">
                <span className={cx("h-2 w-2 shrink-0 rounded-full", KIND_DOT[KIND_LABEL[b.kind]])} title={KIND_LABEL[b.kind]} />
                <Link href={b.href} className="min-w-0 flex-1" title={b.reason}>
                  <span className={cx("block truncate text-[13.5px]", isDone ? "text-muted line-through" : isSkipped ? "text-faint line-through" : "text-ink")}>{b.title}</span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {b.minutes} min · {b.detail}
                  </span>
                </Link>
                <div className="flex shrink-0 gap-0.5">
                  {isDone || isSkipped ? (
                    <button onClick={() => markBlock(date, b.id, "clear")} className="rounded-full p-1.5 text-faint hover:bg-sand hover:text-ink" aria-label="Undo">
                      <RotateCcw size={14} />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => markBlock(date, b.id, "done")} className="rounded-full p-1.5 text-muted hover:bg-ok-50 hover:text-ok" aria-label="Mark as done">
                        <Check size={15} />
                      </button>
                      <button onClick={() => markBlock(date, b.id, "skipped")} className="rounded-full p-1.5 text-muted hover:bg-sand hover:text-ink" aria-label="Skip">
                        <SkipForward size={14} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ScheduleEditor() {
  const profile = useVerba((s) => s.profile!);
  const update = useVerba((s) => s.updateProfile);
  return (
    <Card className="p-6">
      <CardHeader eyebrow="Schedule" title="Change it any time" />
      <div className="space-y-5">
        <div>
          <div className="mb-2 text-[13px] font-medium text-ink-2">Study days</div>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <Chip
                key={d}
                active={profile.studyDays.includes(d)}
                className="w-11 justify-center px-0"
                onClick={() => {
                  const days = profile.studyDays.includes(d) ? profile.studyDays.filter((x) => x !== d) : [...profile.studyDays, d];
                  if (days.length) update({ studyDays: days, daysPerWeek: days.length });
                }}
              >
                {WEEKDAYS_SHORT[d].slice(0, 2)}
              </Chip>
            ))}
          </div>
        </div>
        <Field label={`Minutes per day: ${profile.minutesPerDay}`}>
          <input type="range" min={15} max={120} step={5} value={profile.minutesPerDay} onChange={(e) => update({ minutesPerDay: Number(e.target.value) })} className="w-full accent-[var(--color-accent)]" />
        </Field>
        <Field label="Exam date">
          <input type="date" className={inputCls} value={profile.examDate ?? ""} min={todayISO()} onChange={(e) => update({ examDate: e.target.value || undefined })} />
        </Field>
        <p className="flex items-start gap-1.5 text-[12px] text-muted">
          <Flag size={13} className="mt-0.5 shrink-0" /> Changes apply instantly to the week view and milestones.
        </p>
      </div>
    </Card>
  );
}
