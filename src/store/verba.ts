"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Attempt,
  ChatMessage,
  DiagnosticSection,
  DiagnosticState,
  Level,
  Mistake,
  MockResult,
  PlanOverrides,
  Profile,
  Question,
  Skill,
  SkillEstimate,
  SpeakingSession,
  StudySession,
  Topic,
  VocabEntry,
  VocabProgress,
  WritingSubmission,
} from "@/domain/types";
import { applyResult, newEstimate } from "@/engine/adaptive";
import { SKILLS } from "@/engine/levels";
import { masteryFor, newProgress, nextMistakeReview, review, type Grade } from "@/engine/srs";
import { todayISO, uid } from "@/lib/dates";
import { storage } from "@/services/storage";

export interface VerbaData {
  version: 1;
  profile: Profile | null;
  levels: Record<Skill, SkillEstimate>;
  diagnostic: DiagnosticState;
  attempts: Attempt[];
  mistakes: Record<string, Mistake>;
  vocab: Record<string, VocabProgress>;
  customVocab: VocabEntry[];
  sessions: StudySession[];
  lessonsDone: Record<string, { score: number; date: string; best: number }>;
  writing: WritingSubmission[];
  speaking: SpeakingSession[];
  mocks: MockResult[];
  plan: PlanOverrides;
  chat: ChatMessage[];
  achievements: Record<string, string>; // id → unlockedAt
  /** Reading speed samples (words per minute). */
  readingSpeed: { date: string; wpm: number; textId: string }[];
  demo: boolean;
}

export interface VerbaActions {
  completeOnboarding(p: Omit<Profile, "createdAt">): void;
  updateProfile(p: Partial<Profile>): void;
  recordAnswer(q: Question, answer: string, correct: boolean, source: Attempt["source"]): void;
  logSession(s: Omit<StudySession, "id" | "date"> & { date?: string }): void;
  completeLesson(id: string, score: number): void;
  // diagnostic
  startDiagnostic(section: DiagnosticSection, ability: number): void;
  diagnosticStep(questionId: string, correct: boolean, ability: number): void;
  finishDiagnostic(section: DiagnosticSection, score: number, correct: number, total: number): void;
  cancelDiagnosticSection(): void;
  resetDiagnostic(): void;
  setSkillScore(skill: Skill, score: number): void;
  // vocabulary
  saveWord(entryId: string): void;
  unsaveWord(entryId: string): void;
  reviewWord(entryId: string, grade: Grade): void;
  setPersonalExample(entryId: string, text: string): void;
  addCustomWord(e: Omit<VocabEntry, "id">): string;
  deleteCustomWord(id: string): void;
  // mistakes
  deleteMistake(id: string): void;
  // writing & speaking
  saveWriting(sub: WritingSubmission): void;
  deleteWriting(id: string): void;
  saveSpeaking(s: SpeakingSession): void;
  // mocks
  saveMock(m: MockResult): void;
  // reading
  logReadingSpeed(textId: string, wpm: number): void;
  // plan
  markBlock(date: string, blockId: string, state: "done" | "skipped" | "clear"): void;
  // tutor
  addChat(m: Omit<ChatMessage, "id" | "date">): void;
  clearChat(): void;
  unlock(ids: string[]): void;
  // data
  importData(d: VerbaData): void;
  reset(): void;
}

export type VerbaState = VerbaData & VerbaActions;

function freshLevels(): Record<Skill, SkillEstimate> {
  return Object.fromEntries(SKILLS.map((s) => [s, newEstimate()])) as Record<Skill, SkillEstimate>;
}

export function initialData(): VerbaData {
  return {
    version: 1,
    profile: null,
    levels: freshLevels(),
    diagnostic: { completed: {} },
    attempts: [],
    mistakes: {},
    vocab: {},
    customVocab: [],
    sessions: [],
    lessonsDone: {},
    writing: [],
    speaking: [],
    mocks: [],
    plan: { skipped: {}, done: {} },
    chat: [],
    achievements: {},
    readingSpeed: [],
    demo: false,
  };
}

/** Which skills an item also informs (Use of English feeds grammar & vocabulary). */
function linkedSkill(q: Question): Skill | null {
  if (q.skill !== "useOfEnglish") return null;
  const vocabTopics: Topic[] = ["collocations", "phrasal-verbs", "idioms", "word-formation", "vocabulary", "prepositions"];
  return vocabTopics.includes(q.topic) ? "vocabulary" : "grammar";
}

function answerText(q: Question): string {
  return q.answers[0] ?? "";
}

export const useVerba = create<VerbaState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      completeOnboarding(p) {
        set({ profile: { ...p, createdAt: new Date().toISOString() } });
      },

      updateProfile(p) {
        const cur = get().profile;
        if (cur) set({ profile: { ...cur, ...p } });
      },

      recordAnswer(q, answer, correct, source) {
        const now = new Date().toISOString();
        const today = todayISO();
        const attempt: Attempt = {
          id: uid("at"),
          questionId: q.id,
          skill: q.skill,
          topic: q.topic,
          level: q.level as Level,
          correct,
          answer,
          date: now,
          source,
        };
        set((s) => {
          const levels = { ...s.levels };
          // The diagnostic sets its own scores at the end of each section.
          if (source !== "diagnostic") {
            levels[q.skill] = applyResult(levels[q.skill], q.level, correct);
            const linked = linkedSkill(q);
            if (linked) {
              // weaker signal for the linked skill: only every other evidence point
              const e = levels[linked];
              levels[linked] = attempt.id.charCodeAt(attempt.id.length - 1) % 2 ? applyResult(e, q.level, correct) : e;
            }
          }
          const mistakes = { ...s.mistakes };
          const existing = mistakes[q.id];
          if (!correct) {
            mistakes[q.id] = existing
              ? {
                  ...existing,
                  yourAnswer: answer,
                  lastSeen: now,
                  timesWrong: existing.timesWrong + 1,
                  timesRightSince: 0,
                  mastery: masteryFor(existing.timesWrong + 1, 0),
                  due: today,
                }
              : {
                  id: q.id,
                  questionId: q.id,
                  prompt: q.prompt,
                  original: q.original,
                  keyword: q.keyword,
                  stem: q.stem,
                  options: q.options,
                  yourAnswer: answer,
                  correctAnswer: answerText(q),
                  explanation: q.explanation,
                  skill: q.skill,
                  topic: q.topic,
                  level: q.level,
                  firstSeen: now,
                  lastSeen: now,
                  timesWrong: 1,
                  timesRightSince: 0,
                  mastery: "new",
                  due: nextMistakeReview(0, today),
                };
          } else if (existing) {
            const right = existing.timesRightSince + 1;
            mistakes[q.id] = {
              ...existing,
              lastSeen: now,
              timesRightSince: right,
              mastery: masteryFor(existing.timesWrong, right),
              due: nextMistakeReview(right, today),
            };
          }
          return { attempts: [...s.attempts, attempt].slice(-4000), levels, mistakes };
        });
      },

      logSession(sess) {
        const date = sess.date ?? new Date().toISOString();
        set((s) => ({ sessions: [...s.sessions, { ...sess, id: uid("ss"), date }].slice(-3000) }));
      },

      completeLesson(id, score) {
        set((s) => {
          const prev = s.lessonsDone[id];
          return {
            lessonsDone: { ...s.lessonsDone, [id]: { score, date: new Date().toISOString(), best: Math.max(score, prev?.best ?? 0) } },
          };
        });
      },

      startDiagnostic(section, ability) {
        set((s) => ({ diagnostic: { ...s.diagnostic, current: { section, ability, asked: [], correct: 0, total: 0 } } }));
      },

      diagnosticStep(questionId, correct, ability) {
        set((s) => {
          const c = s.diagnostic.current;
          if (!c) return {};
          return {
            diagnostic: {
              ...s.diagnostic,
              current: { ...c, ability, asked: [...c.asked, questionId], correct: c.correct + (correct ? 1 : 0), total: c.total + 1 },
            },
          };
        });
      },

      finishDiagnostic(section, score, correct, total) {
        set((s) => {
          const completed = { ...s.diagnostic.completed, [section]: { score, correct, total, date: new Date().toISOString() } };
          const levels = { ...s.levels };
          const est = levels[section as Skill];
          const d = todayISO();
          levels[section as Skill] = {
            score,
            evidence: Math.max(est.evidence, 6),
            updatedAt: d,
            history: [...est.history.filter((h) => h.date !== d), { date: d, score }],
          };
          const allDone = (["grammar", "vocabulary", "reading", "useOfEnglish", "listening", "writing", "speaking"] as DiagnosticSection[]).every(
            (k) => completed[k],
          );
          return {
            levels,
            diagnostic: { completed, current: undefined, finishedAt: allDone ? new Date().toISOString() : s.diagnostic.finishedAt },
          };
        });
      },

      cancelDiagnosticSection() {
        set((s) => ({ diagnostic: { ...s.diagnostic, current: undefined } }));
      },

      resetDiagnostic() {
        set({ diagnostic: { completed: {} } });
      },

      setSkillScore(skill, score) {
        set((s) => {
          const est = s.levels[skill];
          const d = todayISO();
          return {
            levels: { ...s.levels, [skill]: { ...est, score, updatedAt: d, history: [...est.history.filter((h) => h.date !== d), { date: d, score }] } },
          };
        });
      },

      saveWord(entryId) {
        set((s) => ({ vocab: { ...s.vocab, [entryId]: s.vocab[entryId] ? { ...s.vocab[entryId], saved: true } : newProgress(entryId) } }));
      },

      unsaveWord(entryId) {
        set((s) => (s.vocab[entryId] ? { vocab: { ...s.vocab, [entryId]: { ...s.vocab[entryId], saved: false } } } : {}));
      },

      reviewWord(entryId, grade) {
        set((s) => {
          const p = s.vocab[entryId] ?? newProgress(entryId);
          return { vocab: { ...s.vocab, [entryId]: review(p, grade) } };
        });
      },

      setPersonalExample(entryId, text) {
        set((s) => {
          const p = s.vocab[entryId] ?? newProgress(entryId);
          return { vocab: { ...s.vocab, [entryId]: { ...p, personalExample: text } } };
        });
      },

      addCustomWord(e) {
        const id = uid("custom");
        set((s) => ({ customVocab: [...s.customVocab, { ...e, id }], vocab: { ...s.vocab, [id]: newProgress(id) } }));
        return id;
      },

      deleteCustomWord(id) {
        set((s) => {
          const vocab = { ...s.vocab };
          delete vocab[id];
          return { customVocab: s.customVocab.filter((c) => c.id !== id), vocab };
        });
      },

      deleteMistake(id) {
        set((s) => {
          const mistakes = { ...s.mistakes };
          delete mistakes[id];
          return { mistakes };
        });
      },

      saveWriting(sub) {
        set((s) => {
          const others = s.writing.filter((w) => w.id !== sub.id);
          return { writing: [...others, sub] };
        });
      },

      deleteWriting(id) {
        set((s) => ({ writing: s.writing.filter((w) => w.id !== id) }));
      },

      saveSpeaking(sp) {
        set((s) => ({ speaking: [...s.speaking.filter((x) => x.id !== sp.id), sp] }));
      },

      saveMock(m) {
        set((s) => ({ mocks: [...s.mocks, m] }));
      },

      logReadingSpeed(textId, wpm) {
        set((s) => ({ readingSpeed: [...s.readingSpeed, { date: new Date().toISOString(), wpm, textId }].slice(-200) }));
      },

      markBlock(date, blockId, state) {
        set((s) => {
          const done = { ...s.plan.done };
          const skipped = { ...s.plan.skipped };
          done[date] = (done[date] ?? []).filter((x) => x !== blockId);
          skipped[date] = (skipped[date] ?? []).filter((x) => x !== blockId);
          if (state === "done") done[date].push(blockId);
          if (state === "skipped") skipped[date].push(blockId);
          return { plan: { done, skipped } };
        });
      },

      addChat(m) {
        set((s) => ({ chat: [...s.chat, { ...m, id: uid("msg"), date: new Date().toISOString() }].slice(-200) }));
      },

      clearChat() {
        set({ chat: [] });
      },

      unlock(ids) {
        if (!ids.length) return;
        set((s) => {
          const a = { ...s.achievements };
          for (const id of ids) if (!a[id]) a[id] = new Date().toISOString();
          return { achievements: a };
        });
      },

      importData(d) {
        set({ ...initialData(), ...d });
      },

      reset() {
        set(initialData());
      },
    }),
    {
      name: "verba-v1",
      version: 1,
      storage: createJSONStorage(() => storage),
      partialize: (s) => {
        // persist data only (actions are recreated)
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(s)) if (typeof v !== "function") out[k] = v;
        return out as unknown as VerbaState;
      },
    },
  ),
);

/** Plain snapshot of the data (for export, the AI tutor context, etc.). */
export function snapshot(): VerbaData {
  const s = useVerba.getState();
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) if (typeof v !== "function") out[k] = v;
  return out as unknown as VerbaData;
}
