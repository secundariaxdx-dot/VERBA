import type { Mastery, VocabProgress } from "@/domain/types";
import { addDays, todayISO } from "@/lib/dates";

/** Review quality: 0 = forgot, 3 = hard, 4 = good, 5 = easy. */
export type Grade = 0 | 3 | 4 | 5;

export function newProgress(entryId: string, saved = true): VocabProgress {
  return { entryId, saved, ease: 2.5, interval: 0, repetitions: 0, due: todayISO(), lapses: 0 };
}

/**
 * SM-2 with a lapse penalty: words you keep forgetting get a lower ease and
 * therefore come back much more often.
 */
export function review(p: VocabProgress, grade: Grade, today = todayISO()): VocabProgress {
  let { ease, interval, repetitions, lapses } = p;
  if (grade < 3) {
    repetitions = 0;
    interval = 1;
    lapses += 1;
    ease = Math.max(1.3, ease - 0.25);
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = grade === 5 ? 3 : 1;
    else if (repetitions === 2) interval = grade === 3 ? 3 : 6;
    else interval = Math.round(interval * ease * (grade === 3 ? 0.8 : grade === 5 ? 1.2 : 1));
    ease = Math.max(1.3, ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  }
  // repeated lapses shorten everything
  if (lapses >= 3) interval = Math.max(1, Math.round(interval * 0.6));
  return {
    ...p,
    ease: Math.round(ease * 100) / 100,
    interval,
    repetitions,
    lapses,
    due: addDays(today, interval),
    lastReviewed: today,
    difficult: lapses >= 2 || ease < 1.8,
  };
}

export function isDue(p: VocabProgress, today = todayISO()): boolean {
  return p.saved && p.due <= today;
}

/** Retained = reviewed at least twice in a row successfully. */
export function isRetained(p: VocabProgress): boolean {
  return p.repetitions >= 2;
}

/** Mistake scheduling: 1 → 3 → 7 → 14 days after each correct retry; reset on a miss. */
export function nextMistakeReview(timesRightSince: number, today = todayISO()): string {
  const steps = [1, 3, 7, 14, 30];
  return addDays(today, steps[Math.min(timesRightSince, steps.length - 1)]);
}

export function masteryFor(timesWrong: number, timesRightSince: number): Mastery {
  if (timesRightSince >= 3) return "mastered";
  if (timesRightSince >= 2) return "improving";
  if (timesRightSince >= 1 || timesWrong === 1) return "learning";
  return "new";
}
