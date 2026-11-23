import type { Question } from "@/domain/types";
import type { VerbaData } from "@/store/verba";
import { LEVEL_DIFFICULTY } from "./levels";

/**
 * Build an adaptive practice set:
 *  1. mistakes on these items that are due (spaced review),
 *  2. unseen items pitched slightly above the learner's ability,
 *  3. then the rest, least-recently seen first.
 * Items answered correctly many times are pushed to the back.
 */
export function buildSet(pool: Question[], data: VerbaData, n: number, ability: number, today: string): Question[] {
  const seen = new Map<string, { n: number; right: number; last: string }>();
  for (const a of data.attempts) {
    const s = seen.get(a.questionId) ?? { n: 0, right: 0, last: "" };
    s.n++;
    if (a.correct) s.right++;
    s.last = a.date;
    seen.set(a.questionId, s);
  }
  const target = ability + 4;
  const scored = pool.map((q) => {
    const m = data.mistakes[q.id];
    const s = seen.get(q.id);
    let score = 0;
    if (m && m.mastery !== "mastered" && m.due <= today) score += 30 + m.timesWrong * 4;
    if (!s) score += 14;
    else score -= s.right * 3;
    score -= Math.abs(LEVEL_DIFFICULTY[q.level] - target) * 0.6;
    score += Math.random() * 6;
    return { q, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((x) => x.q);
}
