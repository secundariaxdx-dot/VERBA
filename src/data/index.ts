import type { Question, VocabEntry, Level, Skill } from "@/domain/types";
import { USE_OF_ENGLISH } from "./useOfEnglish";
import { GRAMMAR } from "./grammar";
import { READING } from "./reading";
import { LISTENING } from "./listening";
import { VOCABULARY } from "./vocabulary";
import { WRITING_TASKS } from "./writing";
import { SPEAKING_TASKS } from "./speaking";
import { LESSONS } from "./lessons";

export { USE_OF_ENGLISH, GRAMMAR, READING, LISTENING, VOCABULARY, WRITING_TASKS, SPEAKING_TASKS, LESSONS };

/** Every gradable question in the app, by id. */
const ALL: Question[] = [
  ...USE_OF_ENGLISH,
  ...GRAMMAR,
  ...READING.flatMap((t) => t.questions),
  ...LISTENING.flatMap((t) => t.questions),
  ...LESSONS.flatMap((l) => [...l.practice, ...l.test]),
];
const BY_ID = new Map(ALL.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id) ?? vocabQuestionById(id);
}

export function allQuestions(): Question[] {
  return ALL;
}

// ───────────── Vocabulary questions (generated from the vocabulary bank) ─────────────

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic "Which word means …?" item for a vocabulary entry. */
export function vocabQuestion(entry: VocabEntry, pool: VocabEntry[] = VOCABULARY): Question {
  const others = pool.filter((e) => e.id !== entry.id && e.pos === entry.pos);
  const fallback = pool.filter((e) => e.id !== entry.id);
  const source = others.length >= 3 ? others : fallback;
  const h = hash(entry.id);
  const distractors: string[] = [];
  for (let i = 0; distractors.length < 3 && i < source.length * 6; i++) {
    const cand = source[(h + i * 5 + Math.floor(i / source.length)) % source.length].term;
    if (!distractors.includes(cand) && cand !== entry.term) distractors.push(cand);
  }
  const options = [...distractors];
  options.splice(h % 4, 0, entry.term);
  return {
    id: `vq-${entry.id}`,
    skill: "vocabulary",
    topic: entry.category === "collocation" ? "collocations" : entry.category === "phrasal-verb" ? "phrasal-verbs" : entry.category === "idiom" ? "idioms" : entry.category === "word-formation" ? "word-formation" : entry.category === "formal" || entry.category === "informal" ? "register" : "vocabulary",
    level: entry.level,
    kind: "mcq",
    prompt: `Which ${entry.pos.includes("verb") ? "expression" : "word or phrase"} means: “${entry.definition}”?`,
    options,
    answers: [entry.term],
    explanation: `“${entry.term}” — ${entry.definition} Example: ${entry.example}`,
    explanationEs: entry.spanish,
    theme: entry.topic,
  };
}

function vocabQuestionById(id: string): Question | undefined {
  if (!id.startsWith("vq-")) return undefined;
  const e = VOCABULARY.find((v) => `vq-${v.id}` === id);
  return e ? vocabQuestion(e) : undefined;
}

/** Items used by each diagnostic section. */
export function diagnosticPool(section: Skill): Question[] {
  switch (section) {
    case "grammar":
      return GRAMMAR;
    case "vocabulary":
      return [
        ...VOCABULARY.map((v) => vocabQuestion(v)),
        ...USE_OF_ENGLISH.filter((q) => q.part === "multiple-choice-cloze"),
      ];
    case "useOfEnglish":
      return USE_OF_ENGLISH.filter((q) => q.part !== "multiple-choice-cloze");
    default:
      return [];
  }
}

export function levelOrder(l: Level): number {
  return { B2: 0, "B2+": 1, C1: 2, "C1+": 3 }[l];
}
