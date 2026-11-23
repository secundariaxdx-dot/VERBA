import type { Attempt, Level, Mistake, Question, Skill, SkillEstimate, Topic } from "@/domain/types";
import { LEVEL_DIFFICULTY, START_ABILITY, TRACKED_TOPICS, levelFor } from "./levels";
import { todayISO } from "@/lib/dates";

/** Probability of answering an item correctly (1-parameter logistic, scale units). */
export function pCorrect(ability: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-(ability - difficulty) / 6));
}

/** Elo-style update. K shrinks as evidence grows so estimates stabilise. */
export function updateAbility(ability: number, level: Level, correct: boolean, evidence: number): number {
  const d = LEVEL_DIFFICULTY[level];
  const k = Math.max(1.2, 9 / Math.sqrt(1 + evidence / 3));
  const next = ability + k * ((correct ? 1 : 0) - pCorrect(ability, d));
  return Math.max(140, Math.min(210, Math.round(next * 10) / 10));
}

export function newEstimate(score = START_ABILITY): SkillEstimate {
  const d = todayISO();
  return { score, evidence: 0, updatedAt: d, history: [{ date: d, score }] };
}

export function applyResult(est: SkillEstimate, level: Level, correct: boolean): SkillEstimate {
  const score = updateAbility(est.score, level, correct, est.evidence);
  const date = todayISO();
  const history = [...est.history];
  const last = history[history.length - 1];
  if (last && last.date === date) history[history.length - 1] = { date, score };
  else history.push({ date, score });
  return { score, evidence: est.evidence + 1, updatedAt: date, history: history.slice(-180) };
}

/** Pick the unseen item whose difficulty best matches the current ability (adaptive). */
export function pickAdaptive(pool: Question[], ability: number, asked: Set<string>): Question | undefined {
  const candidates = pool.filter((q) => !asked.has(q.id));
  if (!candidates.length) return undefined;
  const target = ability + 1; // aim slightly above current level
  const scored = candidates.map((q) => ({ q, gap: Math.abs(LEVEL_DIFFICULTY[q.level] - target) + Math.random() * 2.5 }));
  scored.sort((a, b) => a.gap - b.gap);
  return scored[0].q;
}

/** Recommended content level for a skill: slightly above ability, never below B2+ once ability ≥ C1. */
export function targetLevel(score: number): Level {
  return levelFor(score + 4);
}

/** Accuracy per topic from attempts (recent attempts weigh more). */
export function topicAccuracy(attempts: Attempt[]): Map<Topic, { correct: number; total: number; acc: number }> {
  const map = new Map<Topic, { correct: number; total: number; acc: number }>();
  const recent = attempts.slice(-600);
  for (const a of recent) {
    const m = map.get(a.topic) ?? { correct: 0, total: 0, acc: 0 };
    m.total += 1;
    if (a.correct) m.correct += 1;
    map.set(a.topic, m);
  }
  for (const v of map.values()) v.acc = v.total ? v.correct / v.total : 0;
  return map;
}

export interface WeakTopic {
  topic: Topic;
  weight: number;
  acc: number | null;
  openMistakes: number;
  repeated: number;
}

/**
 * Weak-topic ranking: combines accuracy, open mistakes and repeated mistakes.
 * Repeated mistakes count double — they are the strongest signal.
 */
export function weakTopics(attempts: Attempt[], mistakes: Mistake[], limit = 5): WeakTopic[] {
  const acc = topicAccuracy(attempts);
  const rows: WeakTopic[] = TRACKED_TOPICS.map((topic) => {
    const a = acc.get(topic);
    const open = mistakes.filter((m) => m.topic === topic && m.mastery !== "mastered");
    const repeated = open.filter((m) => m.timesWrong >= 2).length;
    const accPenalty = a && a.total >= 3 ? (1 - a.acc) * 3 : 0;
    return { topic, acc: a ? a.acc : null, openMistakes: open.length, repeated, weight: accPenalty + open.length * 0.6 + repeated * 1.2 };
  });
  return rows.filter((r) => r.weight > 0).sort((x, y) => y.weight - x.weight).slice(0, limit);
}

export function weakestSkill(levels: Record<Skill, SkillEstimate>): Skill {
  return (Object.keys(levels) as Skill[]).sort((a, b) => levels[a].score - levels[b].score)[0];
}

export function strongestSkill(levels: Record<Skill, SkillEstimate>): Skill {
  return (Object.keys(levels) as Skill[]).sort((a, b) => levels[b].score - levels[a].score)[0];
}

export function overallScore(levels: Record<Skill, SkillEstimate>): number {
  const v = Object.values(levels).map((e) => e.score);
  return Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10;
}
