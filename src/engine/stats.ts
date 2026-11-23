import type { Skill, StudySession } from "@/domain/types";
import type { VerbaData } from "@/store/verba";
import { addDays, startOfWeek, todayISO } from "@/lib/dates";
import { isRetained } from "./srs";
import { overallScore } from "./adaptive";

export function minutesByDay(sessions: StudySession[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sessions) {
    const d = todayISO(new Date(s.date));
    m.set(d, (m.get(d) ?? 0) + s.minutes);
  }
  return m;
}

export function streak(sessions: StudySession[], today = todayISO()): { current: number; best: number } {
  const days = new Set(sessions.map((s) => todayISO(new Date(s.date))));
  let current = 0;
  let d = days.has(today) ? today : addDays(today, -1); // today not studied yet doesn't break the streak
  while (days.has(d)) {
    current++;
    d = addDays(d, -1);
  }
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { current, best: Math.max(best, current) };
}

export function weekActivity(sessions: StudySession[], anchor = todayISO()): { date: string; minutes: number }[] {
  const by = minutesByDay(sessions);
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, minutes: by.get(date) ?? 0 };
  });
}

export type Range = "week" | "month" | "all";

export function rangeStart(range: Range, today = todayISO()): string {
  if (range === "week") return addDays(today, -6);
  if (range === "month") return addDays(today, -29);
  return "0000-01-01";
}

export function inRange(dateIso: string, range: Range, today = todayISO()): boolean {
  return todayISO(new Date(dateIso)) >= rangeStart(range, today);
}

export function dailySeries(sessions: StudySession[], range: Range, today = todayISO()): { date: string; minutes: number }[] {
  const by = minutesByDay(sessions);
  let start = rangeStart(range, today);
  if (range === "all") {
    const first = [...by.keys()].sort()[0] ?? addDays(today, -29);
    start = first < addDays(today, -89) ? addDays(today, -89) : first;
  }
  const out: { date: string; minutes: number }[] = [];
  for (let d = start; d <= today; d = addDays(d, 1)) out.push({ date: d, minutes: by.get(d) ?? 0 });
  return out;
}

export function accuracyBySkill(data: VerbaData, range: Range): Record<Skill, { correct: number; total: number }> {
  const out = {} as Record<Skill, { correct: number; total: number }>;
  for (const a of data.attempts) {
    if (!inRange(a.date, range)) continue;
    const r = (out[a.skill] ??= { correct: 0, total: 0 });
    r.total++;
    if (a.correct) r.correct++;
  }
  return out;
}

/** Overall estimated level over time (daily average of skill histories). */
export function levelSeries(data: VerbaData): { date: string; score: number }[] {
  const dates = new Set<string>();
  for (const e of Object.values(data.levels)) for (const h of e.history) dates.add(h.date);
  const sorted = [...dates].sort();
  return sorted.map((date) => {
    const scores = Object.values(data.levels).map((e) => {
      let last = e.history[0]?.score ?? e.score;
      for (const h of e.history) if (h.date <= date) last = h.score;
      return last;
    });
    return { date, score: Math.round((scores.reduce((s, x) => s + x, 0) / scores.length) * 10) / 10 };
  });
}

export function vocabStats(data: VerbaData) {
  const saved = Object.values(data.vocab).filter((v) => v.saved);
  return {
    saved: saved.length,
    retained: saved.filter(isRetained).length,
    difficult: saved.filter((v) => v.difficult).length,
    reviewed: saved.filter((v) => v.lastReviewed).length,
  };
}

export function overallProgressDelta(data: VerbaData, days = 14): number {
  const series = levelSeries(data);
  if (series.length < 2) return 0;
  const cutoff = addDays(todayISO(), -days);
  const before = [...series].reverse().find((p) => p.date <= cutoff) ?? series[0];
  return Math.round((overallScore(data.levels) - before.score) * 10) / 10;
}

export function personalBests(data: VerbaData) {
  const byDay = minutesByDay(data.sessions);
  const bestDay = Math.max(0, ...byDay.values());
  const bestMock = Math.max(0, ...data.mocks.map((m) => m.overallScale));
  const bestWriting = Math.max(0, ...data.writing.filter((w) => w.feedback).map((w) => w.feedback!.scaleScore));
  const bestLesson = Math.max(0, ...Object.values(data.lessonsDone).map((l) => l.best));
  const st = streak(data.sessions);
  return { bestDay, bestMock, bestWriting, bestLesson, bestStreak: st.best };
}
