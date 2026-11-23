import type { Attempt, Mistake, Profile, Skill, StudySession, VocabProgress } from "@/domain/types";
import type { VerbaData } from "@/store/verba";
import { initialData } from "@/store/verba";
import { GRAMMAR, USE_OF_ENGLISH, VOCABULARY, LESSONS } from "@/data";
import { addDays, todayISO } from "@/lib/dates";
import { masteryFor, nextMistakeReview } from "@/engine/srs";
import { newlyUnlocked } from "@/engine/achievements";

/**
 * Sample progress so the app can be explored before real data exists.
 * Deterministic (seeded) so screenshots and tests are stable.
 */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function buildDemoData(profile: Omit<Profile, "createdAt">): VerbaData {
  const r = rng(42);
  const today = todayISO();
  const d = initialData();
  d.demo = true;
  d.profile = { ...profile, createdAt: new Date(addDays(today, -24)).toISOString() };

  // Uneven skills, as for a typical B2 First holder: reading strong, writing/speaking weaker.
  const start: Record<Skill, number> = { grammar: 171, vocabulary: 169, reading: 176, useOfEnglish: 168, listening: 172, writing: 165, speaking: 166 };
  const now: Record<Skill, number> = { grammar: 175.5, vocabulary: 173, reading: 181.5, useOfEnglish: 172.5, listening: 175, writing: 169.5, speaking: 170 };
  for (const s of Object.keys(start) as Skill[]) {
    const history = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      return { date: addDays(today, -24 + i * 3), score: Math.round((start[s] + (now[s] - start[s]) * t + (r() - 0.5) * 1.2) * 10) / 10 };
    });
    history[history.length - 1].score = now[s];
    d.levels[s] = { score: now[s], evidence: 30, updatedAt: today, history };
  }
  d.diagnostic = {
    completed: Object.fromEntries((Object.keys(start) as Skill[]).map((s) => [s, { score: start[s], correct: 5, total: 8, date: new Date(addDays(today, -23)).toISOString() }])),
    finishedAt: new Date(addDays(today, -23)).toISOString(),
  };

  // Sessions over the last 24 days (most days, with a current streak)
  const sessions: StudySession[] = [];
  const acts: StudySession["activity"][] = ["lesson", "use-of-english", "vocabulary", "reading", "listening", "writing", "speaking", "mistakes"];
  for (let i = 24; i >= 0; i--) {
    const day = addDays(today, -i);
    const skip = i > 6 && r() < 0.22;
    if (skip) continue;
    if (i === 0) {
      sessions.push({ id: "demo-s-today", date: `${day}T08:10:00`, minutes: 18, activity: "vocabulary", title: "Flashcard review" });
      continue;
    }
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const a = acts[Math.floor(r() * acts.length)];
      sessions.push({ id: `demo-s-${i}-${k}`, date: `${day}T${String(8 + k * 3).padStart(2, "0")}:15:00`, minutes: 8 + Math.floor(r() * 18), activity: a, title: `Sample ${a.replace("-", " ")} session`, score: 55 + Math.floor(r() * 40) });
    }
  }
  d.sessions = sessions;

  // Attempts & mistakes, weighted towards prepositions, collocations, inversion, word formation
  const pool = [...USE_OF_ENGLISH, ...GRAMMAR];
  const weak = new Set(["prepositions", "collocations", "inversion", "word-formation", "articles"]);
  const attempts: Attempt[] = [];
  const mistakes: Record<string, Mistake> = {};
  for (let k = 0; k < 140; k++) {
    const q = pool[Math.floor(r() * pool.length)];
    const pWrong = weak.has(q.topic) ? 0.5 : 0.22;
    const correct = r() > pWrong;
    const day = addDays(today, -Math.floor(r() * 22) - 1);
    const answer = correct ? q.answers[0] : q.options ? q.options.find((o) => o !== q.answers[0]) ?? "" : "—";
    attempts.push({ id: `demo-a-${k}`, questionId: q.id, skill: q.skill, topic: q.topic, level: q.level, correct, answer, date: `${day}T10:00:00`, source: "use-of-english" });
    if (!correct) {
      const m = mistakes[q.id];
      const timesWrong = (m?.timesWrong ?? 0) + 1;
      mistakes[q.id] = {
        id: q.id,
        questionId: q.id,
        prompt: q.prompt,
        original: q.original,
        keyword: q.keyword,
        stem: q.stem,
        options: q.options,
        yourAnswer: answer,
        correctAnswer: q.answers[0],
        explanation: q.explanation,
        skill: q.skill,
        topic: q.topic,
        level: q.level,
        firstSeen: m?.firstSeen ?? `${day}T10:00:00`,
        lastSeen: `${day}T10:00:00`,
        timesWrong,
        timesRightSince: 0,
        mastery: masteryFor(timesWrong, 0),
        due: r() < 0.5 ? today : nextMistakeReview(0, day),
      };
    }
  }
  // a few mistakes already improving
  Object.values(mistakes).slice(0, 4).forEach((m, i) => {
    m.timesRightSince = i < 2 ? 3 : 1;
    m.mastery = masteryFor(m.timesWrong, m.timesRightSince);
    m.due = addDays(today, 3 + i);
  });
  d.attempts = attempts.sort((a, b) => a.date.localeCompare(b.date));
  d.mistakes = mistakes;

  // Vocabulary: 26 saved words with varied schedules
  const vocab: Record<string, VocabProgress> = {};
  VOCABULARY.slice(0, 26).forEach((v, i) => {
    const reps = Math.floor(r() * 4);
    const lapses = i % 7 === 0 ? 3 : i % 5 === 0 ? 1 : 0;
    vocab[v.id] = { entryId: v.id, saved: true, ease: lapses >= 2 ? 1.7 : 2.5, interval: reps * 3, repetitions: reps, due: addDays(today, i % 3 === 0 ? 0 : 1 + (i % 6)), lapses, lastReviewed: addDays(today, -2), difficult: lapses >= 2 };
  });
  d.vocab = vocab;

  // Lessons
  LESSONS.slice(0, 5).forEach((l, i) => {
    const score = 60 + Math.floor(r() * 35);
    d.lessonsDone[l.id] = { score, best: score, date: new Date(addDays(today, -20 + i * 4)).toISOString() };
  });

  d.readingSpeed = [
    { date: new Date(addDays(today, -18)).toISOString(), wpm: 168, textId: "rd-01" },
    { date: new Date(addDays(today, -9)).toISOString(), wpm: 181, textId: "rd-03" },
    { date: new Date(addDays(today, -3)).toISOString(), wpm: 192, textId: "rd-05" },
  ];
  d.mocks = [
    { id: "demo-mock-1", examId: "mini-1", date: new Date(addDays(today, -10)).toISOString(), mode: "exam", papers: [{ paper: "reading-uoe", correct: 14, total: 24, scale: 174 }, { paper: "listening", correct: 7, total: 12, scale: 176 }], overallScale: 175, grade: "B2 certificate — estimate", minutes: 52 },
  ];
  d.achievements = { "first-step": new Date(addDays(today, -24)).toISOString(), diagnosed: new Date(addDays(today, -23)).toISOString(), "streak-3": new Date(addDays(today, -15)).toISOString() };
  for (const id of newlyUnlocked(d)) d.achievements[id] = new Date(addDays(today, -2)).toISOString();
  return d;
}
