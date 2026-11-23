import type { VerbaData } from "@/store/verba";
import { streak, minutesByDay, vocabStats } from "./stats";
import { overallScore } from "./adaptive";
import { C1_THRESHOLD } from "./levels";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  test(d: VerbaData): boolean;
}

/** Subtle, adult milestones — no confetti, just quiet recognition. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-step", title: "First step", description: "Complete your first study session.", test: (d) => d.sessions.length >= 1 },
  { id: "diagnosed", title: "Know your level", description: "Finish the full diagnostic assessment.", test: (d) => Boolean(d.diagnostic.finishedAt) },
  { id: "streak-3", title: "Three in a row", description: "Study three days in a row.", test: (d) => streak(d.sessions).best >= 3 },
  { id: "streak-7", title: "A full week", description: "Keep a 7-day streak.", test: (d) => streak(d.sessions).best >= 7 },
  { id: "streak-30", title: "Habit formed", description: "Keep a 30-day streak.", test: (d) => streak(d.sessions).best >= 30 },
  { id: "lessons-5", title: "Five lessons", description: "Complete five daily lessons.", test: (d) => Object.keys(d.lessonsDone).length >= 5 },
  { id: "lessons-all", title: "Full syllabus", description: "Complete every lesson in the library.", test: (d) => Object.keys(d.lessonsDone).length >= 16 },
  { id: "vocab-25", title: "Word collector", description: "Save 25 words to your vocabulary.", test: (d) => vocabStats(d).saved >= 25 },
  { id: "vocab-retained-20", title: "It stuck", description: "Retain 20 words through spaced repetition.", test: (d) => vocabStats(d).retained >= 20 },
  { id: "mistakes-10", title: "Learning from errors", description: "Master 10 of your past mistakes.", test: (d) => Object.values(d.mistakes).filter((m) => m.mastery === "mastered").length >= 10 },
  { id: "writer", title: "First draft in", description: "Submit a writing task for feedback.", test: (d) => d.writing.some((w) => w.status === "submitted") },
  { id: "speaker", title: "Found your voice", description: "Complete a speaking task.", test: (d) => d.speaking.length >= 1 },
  { id: "mock-1", title: "Exam conditions", description: "Complete a mock exam.", test: (d) => d.mocks.length >= 1 },
  { id: "mock-c1", title: "C1 on paper", description: "Score 180+ (est.) in a mock exam.", test: (d) => d.mocks.some((m) => m.overallScale >= 180) },
  { id: "long-day", title: "Deep work", description: "Study 60 minutes in a single day.", test: (d) => Math.max(0, ...minutesByDay(d.sessions).values()) >= 60 },
  { id: "c1-skill", title: "C1 in one skill", description: "Reach an estimated C1 in any skill.", test: (d) => Object.values(d.levels).some((e) => e.score >= C1_THRESHOLD) },
  { id: "c1-overall", title: "C1 overall", description: "Reach an estimated C1 overall.", test: (d) => overallScore(d.levels) >= C1_THRESHOLD },
];

export function newlyUnlocked(d: VerbaData): string[] {
  return ACHIEVEMENTS.filter((a) => !d.achievements[a.id] && a.test(d)).map((a) => a.id);
}
