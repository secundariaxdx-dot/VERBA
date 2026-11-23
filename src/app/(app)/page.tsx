"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, ArrowUpRight, CalendarClock, Clock, Flame, Gauge, Layers, RotateCcw, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useVerba, snapshot } from "@/store/verba";
import { Badge, ButtonLink, Card, CardHeader, ProgressBar, Ring, cx } from "@/components/ui/primitives";
import { BarChart, SkillBars } from "@/components/charts/Charts";
import { SKILL_LABEL, TOPIC_LABEL, bandFor, progressToC1, C1_THRESHOLD } from "@/engine/levels";
import { overallScore, strongestSkill, weakestSkill, weakTopics } from "@/engine/adaptive";
import { dueCounts, planForDay, recommendLesson, weekPlan, weeksToExam } from "@/engine/planner";
import { minutesByDay, overallProgressDelta, streak, weekActivity } from "@/engine/stats";
import { ACHIEVEMENTS } from "@/engine/achievements";
import { WEEKDAYS_SHORT, daysBetween, formatLong, formatShort, parseISO, todayISO } from "@/lib/dates";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening";
}

function motivation(delta: number, streakDays: number, todayMin: number, goal: number, score: number): string {
  if (todayMin >= goal) return "Today’s goal is done. Anything extra now is a bonus — a short vocabulary review is the best use of it.";
  if (score >= C1_THRESHOLD) return "Your overall estimate is in C1 territory. The job now is consistency under exam conditions.";
  if (delta >= 2) return `Up ${delta.toFixed(1)} points in two weeks — that’s real movement. Keep the rhythm.`;
  if (streakDays >= 5) return `${streakDays} days in a row. Habits like this are what get people through C1.`;
  if (delta < 0) return "A slight dip recently — normal when the material gets harder. Today’s plan focuses on what slipped.";
  return "Small, regular sessions beat long irregular ones. Today’s plan is ready.";
}

export default function Dashboard() {
  const data = useVerba();
  const today = todayISO();
  const d = useMemo(() => snapshot(), [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const profile = data.profile!;
  const score = overallScore(data.levels);
  const band = bandFor(score);
  const pct = progressToC1(score);
  const strong = strongestSkill(data.levels);
  const weak = weakestSkill(data.levels);
  const delta = overallProgressDelta(d, 14);
  const st = streak(data.sessions);
  const byDay = minutesByDay(data.sessions);
  const todayMin = byDay.get(today) ?? 0;
  const goal = profile.minutesPerDay;
  const week = weekActivity(data.sessions);
  const daysStudied = week.filter((w) => w.minutes > 0).length;
  const weeklyGoal = profile.studyDays.length;
  const rec = recommendLesson(d);
  const plan = planForDay(d, today);
  const due = dueCounts(d);
  const wt = weakTopics(data.attempts, Object.values(data.mistakes), 3);
  const diagDone = Object.keys(data.diagnostic.completed).length;
  const weeks = weekPlan(d);
  const examBlockDay = weeks.find((w) => w.date >= today && w.blocks.some((b) => b.kind === "exam"));
  const examDays = profile.examDate ? daysBetween(today, profile.examDate) : null;
  const unlocked = ACHIEVEMENTS.filter((a) => data.achievements[a.id]);
  const lessonDone = data.lessonsDone[rec.lesson.id];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="eyebrow mb-2">{formatLong(today)}</div>
          <h1 className="text-[2.1rem] font-medium leading-[1.1] text-ink sm:text-[2.6rem]">
            {greeting()}, {profile.name}.
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">{motivation(delta, st.current, todayMin, goal, score)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent" className="px-3 py-1 text-[12.5px]">
            Now {band.label}
          </Badge>
          <ArrowRight size={14} className="text-faint" />
          <Badge tone="ok" className="px-3 py-1 text-[12.5px]">
            Target C1
          </Badge>
          {examDays !== null && examDays >= 0 && <Badge tone="outline" className="px-3 py-1 text-[12.5px]">Exam in {examDays} days</Badge>}
          {data.demo && <Badge tone="gold">Sample data</Badge>}
        </div>
      </header>

      {diagDone < 7 && (
        <Card className="flex flex-col gap-4 border-accent/30 bg-accent-50/60 p-5 sm:flex-row sm:items-center">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-card">
            <Gauge size={20} />
          </div>
          <div className="flex-1">
            <div className="font-display text-[17px] text-ink">{diagDone === 0 ? "Find your real level" : `Diagnostic: ${diagDone} of 7 sections done`}</div>
            <p className="text-[14px] text-ink-2">Levels below are {diagDone === 0 ? "based on your self-assessment" : "partly estimated"}. Each short adaptive section makes the plan more accurate.</p>
          </div>
          <ButtonLink href="/diagnostic">{diagDone === 0 ? "Start diagnostic" : "Continue"}</ButtonLink>
        </Card>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <div className="eyebrow mb-3 flex items-center gap-1.5">
            <Gauge size={13} /> Current level
          </div>
          <div className="font-display text-[2rem] leading-none text-ink">{band.short}</div>
          <div className="mt-2 text-[12.5px] text-muted">
            <span className="tabular">{Math.round(score)}</span> on the Cambridge scale <span className="text-faint">(est.)</span>
          </div>
          <div className={cx("mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium", delta >= 0 ? "text-ok" : "text-bad")}>
            {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)} in 14 days
          </div>
        </Card>
        <Card className="flex flex-wrap items-center gap-4 p-5">
          <Ring value={pct} size={86} stroke={8} label={`${pct}% of the way to C1`}>
            <span className="font-display text-xl text-ink tabular">{pct}%</span>
          </Ring>
          <div className="min-w-0">
            <div className="eyebrow mb-1 flex items-center gap-1.5">
              <Target size={13} /> To C1
            </div>
            <div className="text-[13px] leading-snug text-ink-2">{score >= C1_THRESHOLD ? "C1 reached (est.)" : `${Math.ceil(C1_THRESHOLD - score)} points to go`}</div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="eyebrow mb-3 flex items-center gap-1.5">
            <Clock size={13} /> Today’s goal
          </div>
          <div className="font-display text-[2rem] leading-none text-ink tabular">
            {todayMin}
            <span className="text-base text-muted"> / {goal} min</span>
          </div>
          <ProgressBar value={todayMin} max={goal} className="mt-3" tone={todayMin >= goal ? "ok" : "accent"} label="Daily goal" />
        </Card>
        <Card className="p-5">
          <div className="eyebrow mb-3 flex items-center gap-1.5">
            <Flame size={13} /> Streak
          </div>
          <div className="font-display text-[2rem] leading-none text-ink tabular">
            {st.current}
            <span className="text-base text-muted"> day{st.current === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-3 flex gap-1.5" aria-label={`${daysStudied} of ${weeklyGoal} study days this week`}>
            {week.map((w) => (
              <div key={w.date} className="flex-1 text-center">
                <div className={cx("mx-auto h-2 rounded-full", w.minutes > 0 ? "bg-accent" : w.date === today ? "bg-accent-100" : "bg-sand")} />
                <div className="mt-1 text-[9.5px] text-faint">{WEEKDAYS_SHORT[parseISO(w.date).getDay()].charAt(0)}</div>
              </div>
            ))}
          </div>
          <div className="mt-1 text-[12px] text-muted">
            {daysStudied}/{weeklyGoal} days this week · best {st.best}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* Today's lesson */}
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/8 blur-2xl" />
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="eyebrow">Today’s lesson</span>
              <Badge tone="accent">{SKILL_LABEL[rec.lesson.skill]}</Badge>
              <Badge tone="neutral">{rec.lesson.level}</Badge>
              <Badge tone="outline">
                <Clock size={11} /> {rec.lesson.minutes} min
              </Badge>
              {lessonDone && <Badge tone="ok">Best {lessonDone.best}%</Badge>}
            </div>
            <h2 className="text-[1.65rem] font-medium leading-tight text-ink sm:text-[1.9rem]">{rec.lesson.title}</h2>
            <p className="mt-2 text-[15px] text-ink-2">{rec.lesson.objective}</p>
            <div className="mt-5 rounded-2xl bg-sand/55 p-4">
              <div className="eyebrow mb-1 flex items-center gap-1.5">
                <Sparkles size={12} /> Why this lesson
              </div>
              <p className="text-[14px] leading-relaxed text-ink-2">{rec.reason}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={`/lessons?id=${rec.lesson.id}`} size="lg">
                {lessonDone ? "Retake lesson" : "Start lesson"} <ArrowRight size={17} />
              </ButtonLink>
              <ButtonLink href="/plan" variant="secondary" size="lg">
                Today’s full plan
              </ButtonLink>
            </div>
          </div>
        </Card>

        {/* Today's plan */}
        <Card className="p-6">
          <CardHeader
            eyebrow="Today’s plan"
            title={plan.isStudyDay ? `${plan.minutes} minutes, ${plan.blocks.length} steps` : "Rest day"}
            action={
              <Link href="/plan" className="text-[13px] font-medium text-accent hover:text-accent-700">
                Edit
              </Link>
            }
          />
          {plan.isStudyDay ? (
            <ol className="space-y-2.5">
              {plan.blocks.map((b, i) => {
                const doneIds = data.plan.done[today] ?? [];
                const done = doneIds.includes(b.id);
                return (
                  <li key={b.id}>
                    <Link href={b.href} className="group flex items-center gap-3 rounded-xl border border-line/80 bg-paper px-3.5 py-3 transition hover:border-accent/50">
                      <span className={cx("grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold", done ? "bg-ok text-card" : "bg-sand text-ink-2")}>{done ? "✓" : i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className={cx("block truncate text-[14px] font-medium", done ? "text-muted line-through" : "text-ink")}>{b.title}</span>
                        <span className="block truncate text-[12px] text-muted">{b.detail}</span>
                      </span>
                      <span className="tabular text-[12px] text-muted">{b.minutes}′</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-[14px] text-ink-2">No study scheduled today. A 10-minute vocabulary review keeps your streak alive.</p>
          )}
          {(due.words > 0 || due.mistakes > 0) && (
            <div className="mt-4 flex items-center gap-2 text-[13px] text-ink-2">
              <RotateCcw size={14} className="text-accent" /> {due.words} words and {due.mistakes} mistakes due for review
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Progress */}
        <Card className="p-6 lg:col-span-1">
          <CardHeader eyebrow="Progress by skill" title="Where you stand" />
          <SkillBars levels={data.levels} />
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <div>
              <div className="eyebrow mb-1">Strongest</div>
              <div className="text-[14px] font-medium text-ink">{SKILL_LABEL[strong]}</div>
              <div className="text-[12px] text-muted">{bandFor(data.levels[strong].score).label}</div>
            </div>
            <div>
              <div className="eyebrow mb-1">Weakest</div>
              <div className="text-[14px] font-medium text-ink">{SKILL_LABEL[weak]}</div>
              <div className="text-[12px] text-muted">{bandFor(data.levels[weak].score).label}</div>
            </div>
          </div>
        </Card>

        {/* Weekly activity */}
        <Card className="p-6 lg:col-span-2">
          <CardHeader
            eyebrow="Weekly activity"
            title={`${week.reduce((s, w) => s + w.minutes, 0)} minutes this week`}
            action={
              <Link href="/statistics" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-700">
                Statistics <ArrowUpRight size={14} />
              </Link>
            }
          />
          <BarChart data={week.map((w) => ({ key: w.date, label: WEEKDAYS_SHORT[parseISO(w.date).getDay()], value: w.minutes }))} highlight={today} goal={goal} />
          {wt.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <div className="eyebrow mb-2">Focus areas from your mistakes</div>
              <div className="flex flex-wrap gap-2">
                {wt.map((w) => (
                  <Link key={w.topic} href={`/use-of-english?topic=${w.topic}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] text-ink-2 hover:border-accent/50">
                    {TOPIC_LABEL[w.topic]}
                    <span className="text-[11px] text-faint">{w.acc !== null ? `${Math.round(w.acc * 100)}%` : `${w.openMistakes} open`}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <CardHeader eyebrow="Upcoming assessment" title={examBlockDay ? `Weekly mock — ${examBlockDay.date === today ? "today" : formatShort(examBlockDay.date)}` : "Weekly mock exam"} />
          <p className="text-[14px] leading-relaxed text-ink-2">
            {data.mocks.length
              ? `Last result: ${data.mocks[data.mocks.length - 1].overallScale} (est.). A timed paper each week keeps your readiness estimate honest.`
              : "You haven’t sat a mock yet. A first timed paper gives the planner a realistic baseline."}
          </p>
          <ButtonLink href="/mock-exams" variant="secondary" className="mt-4">
            <CalendarClock size={15} /> Mock exams
          </ButtonLink>
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Review queue" title={`${due.words + due.mistakes} items due`} />
          <div className="space-y-2 text-[14px] text-ink-2">
            <Link href="/vocabulary?mode=review" className="flex items-center justify-between rounded-xl bg-paper px-3 py-2.5 hover:bg-sand/50">
              <span className="flex items-center gap-2">
                <Layers size={15} className="text-accent" /> Flashcards
              </span>
              <span className="tabular font-medium text-ink">{due.words}</span>
            </Link>
            <Link href="/mistakes?mode=practice" className="flex items-center justify-between rounded-xl bg-paper px-3 py-2.5 hover:bg-sand/50">
              <span className="flex items-center gap-2">
                <RotateCcw size={15} className="text-accent" /> Mistakes to retry
              </span>
              <span className="tabular font-medium text-ink">{due.mistakes}</span>
            </Link>
          </div>
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Milestones" title={`${unlocked.length} of ${ACHIEVEMENTS.length} unlocked`} />
          <div className="flex flex-wrap gap-1.5">
            {ACHIEVEMENTS.slice(0, 12).map((a) => (
              <span key={a.id} title={`${a.title} — ${a.description}`} className={cx("rounded-full px-2.5 py-1 text-[11.5px]", data.achievements[a.id] ? "bg-gold-50 font-medium text-gold" : "bg-sand/60 text-faint")}>
                {a.title}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-muted">{profile.examDate ? `${weeksToExam(d)} weeks of plan to go.` : "Set an exam date in Settings for monthly milestones."}</p>
        </Card>
      </div>
    </div>
  );
}
