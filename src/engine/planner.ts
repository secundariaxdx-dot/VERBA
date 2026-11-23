import type { Lesson, PlanBlock, Skill, Topic } from "@/domain/types";
import type { VerbaData } from "@/store/verba";
import { LESSONS, READING, LISTENING, WRITING_TASKS, SPEAKING_TASKS } from "@/data";
import { addDays, daysBetween, parseISO, startOfWeek, todayISO } from "@/lib/dates";
import { C1_THRESHOLD, LEVEL_DIFFICULTY, SKILL_LABEL, TOPIC_LABEL, bandFor, levelFor } from "./levels";
import { overallScore, weakTopics, type WeakTopic } from "./adaptive";
import { isDue } from "./srs";

export interface DayPlan {
  date: string;
  isStudyDay: boolean;
  blocks: PlanBlock[];
  minutes: number;
}

export interface Recommendation {
  lesson: Lesson;
  reason: string;
}

const PRODUCTIVE: Skill[] = ["reading", "listening", "writing", "speaking", "useOfEnglish"];

function hashDate(d: string): number {
  return d.split("-").reduce((s, x) => s * 31 + Number(x), 7);
}

/** Skills ordered from weakest to strongest. */
export function skillsByWeakness(data: VerbaData): Skill[] {
  return (Object.keys(data.levels) as Skill[]).sort((a, b) => data.levels[a].score - data.levels[b].score);
}

export function dueCounts(data: VerbaData, today = todayISO()) {
  const words = Object.values(data.vocab).filter((p) => isDue(p, today)).length;
  const mistakes = Object.values(data.mistakes).filter((m) => m.mastery !== "mastered" && m.due <= today).length;
  return { words, mistakes };
}

/**
 * Pick today's lesson: favour weak skills and weak topics, skip lessons far
 * below the learner's level in a skill they already master, then prefer
 * lessons not yet done (or done with a low score).
 */
/** `offset` > 0 picks the next-best lessons, so projected future days vary. */
export function recommendLesson(data: VerbaData, weak: WeakTopic[] = weakTopics(data.attempts, Object.values(data.mistakes)), offset = 0): Recommendation {
  const weakSet = new Map(weak.map((w, i) => [w.topic, 5 - i]));
  const ranked = LESSONS.map((l) => {
    const skillScore = data.levels[l.skill]?.score ?? 172;
    const done = data.lessonsDone[l.id];
    let s = 0;
    s += (C1_THRESHOLD + 6 - skillScore) * 0.35; // weaker skill → higher priority
    s += (weakSet.get(l.topic) ?? 0) * 2.2;
    if (data.profile?.weakSkills.includes(l.skill)) s += 2;
    // level fit: content should sit slightly above current ability
    s -= Math.abs(LEVEL_DIFFICULTY[l.level] - (skillScore + 5)) * 0.18;
    if (skillScore >= C1_THRESHOLD && LEVEL_DIFFICULTY[l.level] < 175) s -= 6; // already C1 → no B2 drills
    if (done) s -= done.best >= 80 ? 14 : 5;
    return { l, s, skillScore, done };
  }).sort((a, b) => b.s - a.s);
  const top = ranked[offset % Math.min(4, ranked.length)];
  const parts: string[] = [];
  const w = weak.find((x) => x.topic === top.l.topic);
  if (w && w.repeated > 0) parts.push(`you've repeated mistakes with ${TOPIC_LABEL[top.l.topic].toLowerCase()} (${w.openMistakes} still open)`);
  else if (w) parts.push(`${TOPIC_LABEL[top.l.topic].toLowerCase()} is one of your weakest areas right now`);
  parts.push(`your ${SKILL_LABEL[top.l.skill]} is estimated at ${bandFor(top.skillScore).label}`);
  if (top.done) parts.push(`last time you scored ${top.done.best}% — worth consolidating`);
  else parts.push(`it pitches ${top.l.level} material just above your current level`);
  return { lesson: top.l, reason: `Selected because ${parts.join(", and ")}.` };
}

/** Content suggestion for a skill block, pitched at the learner's level. */
function pickContent(skill: Skill, data: VerbaData, seed: number): { title: string; href: string } {
  const level = levelFor((data.levels[skill]?.score ?? 172) + 4);
  if (skill === "reading") {
    const pool = READING.filter((r) => r.level === level);
    const t = (pool.length ? pool : READING)[seed % (pool.length || READING.length)];
    return { title: t.title, href: `/reading?id=${t.id}` };
  }
  if (skill === "listening") {
    const pool = LISTENING.filter((r) => r.level === level);
    const t = (pool.length ? pool : LISTENING)[seed % (pool.length || LISTENING.length)];
    return { title: t.title, href: `/listening?id=${t.id}` };
  }
  if (skill === "writing") {
    const t = WRITING_TASKS[seed % WRITING_TASKS.length];
    return { title: t.title, href: `/writing?id=${t.id}` };
  }
  if (skill === "speaking") {
    const t = SPEAKING_TASKS[seed % SPEAKING_TASKS.length];
    return { title: t.title, href: `/speaking?id=${t.id}` };
  }
  return { title: "Mixed Use of English set", href: "/use-of-english" };
}

const SKILL_MINUTES: Record<Skill, number> = { reading: 15, listening: 15, writing: 30, speaking: 12, useOfEnglish: 12, grammar: 12, vocabulary: 10 };
const BLOCK_KIND: Partial<Record<Skill, PlanBlock["kind"]>> = { reading: "reading", listening: "listening", writing: "writing", speaking: "speaking", useOfEnglish: "practice" };

export function planForDay(data: VerbaData, date: string): DayPlan {
  const profile = data.profile;
  const studyDays = profile?.studyDays ?? [1, 2, 3, 4, 5];
  const dow = parseISO(date).getDay();
  const isStudyDay = studyDays.includes(dow);
  if (!isStudyDay) return { date, isStudyDay, blocks: [], minutes: 0 };

  const budget = profile?.minutesPerDay ?? 45;
  const seed = hashDate(date);
  const weak = weakTopics(data.attempts, Object.values(data.mistakes));
  const due = dueCounts(data, date <= todayISO() ? todayISO() : date);
  const order = skillsByWeakness(data);
  const blocks: PlanBlock[] = [];

  // Exam simulation on the last study day of the week.
  const lastStudyDay = [...studyDays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).pop();
  const examDay = dow === lastStudyDay && studyDays.length >= 3;

  // 1. Review first (spaced repetition): it is short and protects what you have learnt.
  if (due.words + due.mistakes > 0 || blocks.length === 0) {
    const mins = Math.min(15, 5 + Math.ceil((due.words + due.mistakes) / 4) * 2);
    blocks.push({
      id: "review",
      kind: "review",
      title: "Spaced-repetition review",
      detail: `${due.words} word${due.words === 1 ? "" : "s"} and ${due.mistakes} mistake${due.mistakes === 1 ? "" : "s"} due`,
      minutes: mins,
      href: due.mistakes > due.words ? "/mistakes?mode=practice" : "/vocabulary?mode=review",
      reason: "Reviewing just before you forget is the cheapest way to make vocabulary and corrections stick.",
    });
  }

  if (examDay) {
    blocks.push({
      id: "exam",
      kind: "exam",
      title: budget >= 60 ? "Timed paper: Reading & Use of English" : "Mini mock: mixed exam tasks",
      detail: "Exam conditions, no hints. Results update your readiness estimate.",
      minutes: Math.max(20, Math.min(budget - 5, 60)),
      href: "/mock-exams",
      reason: "One weekly simulation trains timing and stamina and keeps the readiness estimate honest.",
    });
  } else {
    // 2. Today's lesson.
    const ahead = Math.max(0, daysBetween(todayISO(), date));
    const rec = recommendLesson(data, weak, ahead);
    blocks.push({
      id: `lesson:${rec.lesson.id}`,
      kind: "lesson",
      title: rec.lesson.title,
      detail: `${SKILL_LABEL[rec.lesson.skill]} · ${rec.lesson.level} · ${rec.lesson.minutes} min`,
      minutes: rec.lesson.minutes,
      skill: rec.lesson.skill,
      topic: rec.lesson.topic,
      href: `/lessons?id=${rec.lesson.id}`,
      reason: rec.reason,
    });

    // 3. Targeted practice on the weakest topic.
    const wt: Topic | undefined = weak[seed % Math.max(1, Math.min(2, weak.length))]?.topic ?? weak[0]?.topic;
    if (wt) {
      blocks.push({
        id: `practice:${wt}`,
        kind: "practice",
        title: `Targeted practice: ${TOPIC_LABEL[wt]}`,
        detail: "Exam-style items on your weakest concept",
        minutes: 10,
        topic: wt,
        skill: "useOfEnglish",
        href: `/use-of-english?topic=${wt}`,
        reason: "Your mistake history shows this concept costs you marks; short, frequent sets fix it fastest.",
      });
    }

    // 4. Skill block: weak skills twice as often as strong ones; C1 skills only maintained.
    const productive = order.filter((s) => PRODUCTIVE.includes(s));
    const weighted: Skill[] = [];
    productive.forEach((s, i) => {
      const reps = data.levels[s].score >= C1_THRESHOLD ? 1 : i < 2 ? 3 : 2;
      for (let r = 0; r < reps; r++) weighted.push(s);
    });
    const skill = weighted[seed % weighted.length] ?? "reading";
    const content = pickContent(skill, data, seed);
    const maintenance = data.levels[skill].score >= C1_THRESHOLD;
    blocks.push({
      id: `skill:${skill}`,
      kind: maintenance ? "maintenance" : BLOCK_KIND[skill] ?? "practice",
      title: `${SKILL_LABEL[skill]}: ${content.title}`,
      detail: maintenance ? "Maintenance — you're already at C1 here" : `Pitched at ${levelFor(data.levels[skill].score + 4)}`,
      minutes: SKILL_MINUTES[skill],
      skill,
      href: content.href,
      reason: maintenance
        ? `${SKILL_LABEL[skill]} is already C1, so it only gets light maintenance at C1+ level.`
        : `${SKILL_LABEL[skill]} (${bandFor(data.levels[skill].score).label}) is one of your weaker skills, so it appears more often in the plan.`,
    });

    // 5. New vocabulary if time allows.
    blocks.push({
      id: "vocab-new",
      kind: "vocabulary",
      title: "New C1 vocabulary",
      detail: "Save 5 new words and review them with flashcards",
      minutes: 8,
      skill: "vocabulary",
      href: "/vocabulary",
      reason: "A steady intake of C1 lexis feeds every paper, especially Use of English and Writing.",
    });
  }

  // Fit to the daily budget, keeping priority order (review & lesson first).
  const fitted: PlanBlock[] = [];
  let total = 0;
  for (const b of blocks) {
    if (total + b.minutes <= budget + 5 || fitted.length < 2) {
      fitted.push(b);
      total += b.minutes;
    }
  }
  return { date, isStudyDay, blocks: fitted, minutes: total };
}

export function weekPlan(data: VerbaData, anchor = todayISO()): DayPlan[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => planForDay(data, addDays(start, i)));
}

export interface Milestone {
  month: string; // "Jan 2027"
  date: string;
  targetScore: number;
  title: string;
  focus: string[];
  phase: string;
  reached: boolean;
}

export function weeksToExam(data: VerbaData, today = todayISO()): number {
  const exam = data.profile?.examDate;
  if (!exam) return 20;
  return Math.max(1, Math.round(daysBetween(today, exam) / 7));
}

export function milestones(data: VerbaData, today = todayISO()): Milestone[] {
  const current = overallScore(data.levels);
  const weeks = weeksToExam(data, today);
  const months = Math.max(1, Math.min(12, Math.ceil(weeks / 4.3)));
  const target = Math.max(185, Math.ceil(current + 4));
  const order = skillsByWeakness(data);
  const out: Milestone[] = [];
  for (let i = 1; i <= months; i++) {
    const frac = i / months;
    const date = addDays(today, Math.round((weeks * 7 * i) / months));
    const score = Math.round(current + (target - current) * frac);
    const phase = frac <= 0.3 ? "Foundations" : frac <= 0.65 ? "Build weak skills" : frac < 1 ? "Exam technique" : "Final rehearsal";
    const focus =
      phase === "Foundations"
        ? [`Lift ${SKILL_LABEL[order[0]]} and ${SKILL_LABEL[order[1]]}`, "Close the top 5 grammar gaps", "Build a 150-word C1 vocabulary base"]
        : phase === "Build weak skills"
          ? [`${SKILL_LABEL[order[0]]} to ${bandFor(score + 3).label}`, "One full writing task every week", "Listening with varied accents"]
          : phase === "Exam technique"
            ? ["Timed papers every week", "Key word transformations at 70 %+", "Speaking Part 2 & 3 under time"]
            : ["Two full mock exams", "Review every repeated mistake", "Rest and confidence before exam day"];
    const d = parseISO(date);
    out.push({
      month: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      date,
      targetScore: score,
      title: `${bandFor(score).label} — ${score} (est.)`,
      focus,
      phase,
      reached: current >= score,
    });
  }
  return out;
}

export interface SkillGoal {
  skill: Skill;
  current: number;
  target: number;
  action: string;
}

export function skillGoals(data: VerbaData): SkillGoal[] {
  return skillsByWeakness(data).map((skill) => {
    const current = Math.round(data.levels[skill].score);
    const target = Math.max(current + 3, skill === "writing" || skill === "speaking" ? 182 : 184);
    const actions: Record<Skill, string> = {
      grammar: "Short daily lessons on advanced structures + review of grammar mistakes",
      vocabulary: "10 flashcards a day, save 5 new words from every text you read",
      reading: "Two C1 texts a week, focusing on inference and attitude questions",
      useOfEnglish: "Key word transformations and word formation three times a week",
      listening: "Two recordings a week in learning mode, one in exam mode",
      writing: "One full task a week; rewrite paragraphs using the feedback",
      speaking: "Three timed long turns a week; record and review",
    };
    return { skill, current, target, action: actions[skill] };
  });
}
