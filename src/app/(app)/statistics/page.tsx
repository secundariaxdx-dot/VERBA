"use client";
import { useMemo, useState } from "react";
import { Award, Trophy } from "lucide-react";
import type { Skill, StudySession } from "@/domain/types";
import { useVerba, snapshot } from "@/store/verba";
import { accuracyBySkill, dailySeries, inRange, levelSeries, personalBests, streak, vocabStats, type Range } from "@/engine/stats";
import { ACHIEVEMENTS } from "@/engine/achievements";
import { SKILL_LABEL, SKILLS, bandFor } from "@/engine/levels";
import { overallScore } from "@/engine/adaptive";
import { Card, CardHeader, PageHeader, ProgressBar, Segmented, Stat, cx } from "@/components/ui/primitives";
import { BarChart, Heatmap, LineChart, SkillBars } from "@/components/charts/Charts";
import { addDays, formatShort, parseISO, startOfWeek, todayISO, WEEKDAYS_SHORT } from "@/lib/dates";

function scoreSeries(sessions: StudySession[], activity: StudySession["activity"], range: Range) {
  return sessions
    .filter((s) => s.activity === activity && s.score !== undefined && inRange(s.date, range))
    .map((s) => ({ x: s.date.slice(0, 10), y: s.score!, label: formatShort(s.date.slice(0, 10)) }));
}

function MiniTrend({ title, points, empty, unit = "%", refLine }: { title: string; points: { x: string; y: number; label: string }[]; empty: string; unit?: string; refLine?: number }) {
  const avg = points.length ? Math.round(points.reduce((s, p) => s + p.y, 0) / points.length) : null;
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="eyebrow">{title}</div>
        <div className="tabular font-display text-xl text-ink">{avg === null ? "—" : `${avg}${unit}`}</div>
      </div>
      {points.length >= 2 ? <LineChart points={points} height={110} min={unit === "%" ? 0 : undefined} max={unit === "%" ? 100 : undefined} refLine={refLine} refLabel={refLine ? "C1" : undefined} /> : <p className="py-6 text-center text-[13px] text-muted">{points.length === 1 ? `One result: ${points[0].y}${unit}` : empty}</p>}
    </Card>
  );
}

export default function Statistics() {
  const state = useVerba();
  const data = useMemo(() => snapshot(), [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const [range, setRange] = useState<Range>("month");
  const sessions = state.sessions.filter((s) => inRange(s.date, range));
  const minutes = sessions.reduce((s, x) => s + x.minutes, 0);
  const lessons = sessions.filter((s) => s.activity === "lesson").length;
  const acc = accuracyBySkill(data, range);
  const allAcc = Object.values(acc).reduce((a, b) => ({ c: a.c + b.correct, t: a.t + b.total }), { c: 0, t: 0 });
  const vs = vocabStats(data);
  const st = streak(state.sessions);
  const pb = personalBests(data);
  const series = dailySeries(state.sessions, range);
  const lvl = levelSeries(data).filter((p) => range === "all" || p.date >= addDays(todayISO(), range === "week" ? -6 : -29));
  const score = overallScore(state.levels);

  // weekly totals for the "all" view, daily otherwise
  const bars =
    range === "all"
      ? Object.entries(
          series.reduce<Record<string, number>>((m, d) => {
            const w = startOfWeek(d.date);
            m[w] = (m[w] ?? 0) + d.minutes;
            return m;
          }, {}),
        ).map(([w, v]) => ({ key: w, label: formatShort(w), value: v }))
      : series.map((d) => ({ key: d.date, label: range === "week" ? WEEKDAYS_SHORT[parseISO(d.date).getDay()] : String(parseISO(d.date).getDate()), value: d.minutes }));

  const heat = Array.from({ length: 84 }, (_, i) => {
    const date = addDays(startOfWeek(todayISO()), -77 + i);
    return { date, minutes: state.sessions.filter((s) => s.date.slice(0, 10) === date).reduce((a, b) => a + b.minutes, 0) };
  });

  const writing = state.writing.filter((w) => w.feedback && inRange(w.date, range)).map((w) => ({ x: w.date.slice(0, 10), y: w.feedback!.scaleScore, label: formatShort(w.date.slice(0, 10)) }));
  const speaking = state.speaking.filter((s) => s.feedback && inRange(s.date, range)).map((s) => ({ x: s.date.slice(0, 10), y: Math.round((s.feedback!.scores.reduce((a, b) => a + b.band, 0) / s.feedback!.scores.length / 5) * 100), label: formatShort(s.date.slice(0, 10)) }));
  const mocks = state.mocks.filter((m) => inRange(m.date, range)).map((m) => ({ x: m.date.slice(0, 10), y: m.overallScale, label: formatShort(m.date.slice(0, 10)) }));

  return (
    <div>
      <PageHeader eyebrow="Statistics" title="Your progress, measured" subtitle="All levels and scores are VERBA’s unofficial estimates on the Cambridge English Scale — useful for direction, not a substitute for the real exam." action={<Segmented value={range} onChange={setRange} options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }, { value: "all", label: "All time" }]} />} />

      <Card className="mb-6 grid grid-cols-2 gap-6 p-6 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Study time" value={minutes >= 120 ? `${Math.round(minutes / 6) / 10} h` : `${minutes} min`} hint={`${sessions.length} sessions`} />
        <Stat label="Lessons" value={lessons} hint={`${Object.keys(state.lessonsDone).length} unique completed`} />
        <Stat label="Accuracy" value={allAcc.t ? `${Math.round((allAcc.c / allAcc.t) * 100)}%` : "—"} hint={`${allAcc.t} answers`} />
        <Stat label="Vocabulary" value={vs.saved} hint={`${vs.retained} retained`} />
        <Stat label="Streak" value={`${st.current} d`} hint={`best ${st.best}`} />
        <Stat label="Level (est.)" value={bandFor(score).short} hint={`${Math.round(score)} on the scale`} />
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardHeader eyebrow={range === "all" ? "Weekly study time" : "Daily study time"} title={`${minutes} minutes`} />
          <BarChart data={bars.slice(-(range === "all" ? 14 : 31))} height={170} goal={range === "all" ? undefined : state.profile?.minutesPerDay} highlight={todayISO()} />
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Estimated level over time" title={`${bandFor(score).label} · ${Math.round(score)}`} />
          <LineChart points={lvl.map((p) => ({ x: p.date, y: p.score, label: formatShort(p.date) }))} refLine={180} refLabel="C1 threshold" height={190} format={(v) => v.toFixed(0)} />
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <CardHeader eyebrow="Skills" title="Current estimate by skill" />
          <SkillBars levels={state.levels} />
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Exercise accuracy" title="By skill" />
          <ul className="space-y-3">
            {SKILLS.map((s: Skill) => {
              const a = acc[s];
              const pct = a && a.total ? Math.round((a.correct / a.total) * 100) : null;
              return (
                <li key={s}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="text-ink-2">{SKILL_LABEL[s]}</span>
                    <span className="tabular text-ink">{pct === null ? <span className="text-faint">no answers</span> : `${pct}% · ${a!.total}`}</span>
                  </div>
                  <ProgressBar value={pct ?? 0} tone={pct !== null && pct >= 75 ? "ok" : "accent"} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <MiniTrend title="Reading scores" points={scoreSeries(state.sessions, "reading", range)} empty="Complete a reading text to see scores." />
        <MiniTrend title="Listening scores" points={scoreSeries(state.sessions, "listening", range)} empty="Complete a recording to see scores." />
        <MiniTrend title="Use of English" points={scoreSeries(state.sessions, "use-of-english", range)} empty="Complete a set to see scores." />
        <MiniTrend title="Writing (scale)" points={writing} empty="Submit a writing task." unit="" refLine={180} />
        <MiniTrend title="Speaking" points={speaking} empty="Complete a speaking task." />
        <MiniTrend title="Mock exams (scale)" points={mocks} empty="Sit a mock exam." unit="" refLine={180} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <CardHeader eyebrow="Consistency" title="Last 12 weeks" />
          <Heatmap days={heat} />
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted">
            less
            {[0, 15, 30, 60].map((m) => (
              <span key={m} className="h-3 w-3 rounded-[3px]" style={{ background: m === 0 ? "var(--color-sand)" : `color-mix(in oklab, var(--color-accent) ${25 + (m / 60) * 75}%, var(--color-card))` }} />
            ))}
            more
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
            <Stat label="Best day" value={`${pb.bestDay} min`} />
            <Stat label="Best streak" value={`${pb.bestStreak} d`} />
            <Stat label="Best lesson" value={pb.bestLesson ? `${pb.bestLesson}%` : "—"} />
            <Stat label="Best mock" value={pb.bestMock || "—"} />
          </div>
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Achievements" title={`${Object.keys(state.achievements).length} of ${ACHIEVEMENTS.length}`} />
          <ul className="grid gap-2">
            {ACHIEVEMENTS.map((a) => {
              const on = state.achievements[a.id];
              return (
                <li key={a.id} className={cx("flex items-center gap-3 rounded-xl px-2.5 py-2", on ? "bg-gold-50/60" : "opacity-55")}>
                  <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full", on ? "bg-gold text-card" : "bg-sand text-faint")}>{on ? <Trophy size={14} /> : <Award size={14} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-medium text-ink">{a.title}</span>
                    <span className="block text-[12px] text-muted">{a.description}</span>
                  </span>
                  {on && <span className="text-[11px] text-muted">{formatShort(on.slice(0, 10))}</span>}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
