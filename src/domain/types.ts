/**
 * VERBA domain model.
 *
 * Everything the app knows about the learner lives in a single persisted
 * state object (see src/store/verba.ts). Content banks (src/data/*) are static
 * and typed with the interfaces below.
 */

// ───────────────────────────── Levels & skills ─────────────────────────────

/** Content difficulty bands. */
export type Level = "B2" | "B2+" | "C1" | "C1+";

/** The seven skills VERBA tracks independently (skills can be uneven). */
export type Skill = "grammar" | "vocabulary" | "reading" | "useOfEnglish" | "listening" | "writing" | "speaking";

/** Grammar / vocabulary concepts tracked across exercises and mistakes. */
export type Topic =
  | "inversion"
  | "conditionals"
  | "passive"
  | "reported-speech"
  | "articles"
  | "prepositions"
  | "verb-patterns"
  | "modals"
  | "relative-clauses"
  | "cleft-sentences"
  | "linking"
  | "collocations"
  | "phrasal-verbs"
  | "word-formation"
  | "idioms"
  | "register"
  | "advanced-grammar"
  | "tenses"
  | "vocabulary"
  // reading / listening sub-skills
  | "main-idea"
  | "detail"
  | "inference"
  | "attitude"
  | "meaning-from-context"
  | "text-structure";

export type ContentTopic =
  | "work"
  | "business"
  | "travel"
  | "technology"
  | "society"
  | "education"
  | "environment"
  | "culture"
  | "health"
  | "relationships"
  | "current-affairs"
  | "academic";

// ───────────────────────────── Questions ─────────────────────────────

/** Cambridge C1 Use of English parts. */
export type UoEPart = "multiple-choice-cloze" | "open-cloze" | "word-formation" | "key-word-transformation";

/**
 * One gradable item. Used by Use of English, grammar drills, lessons,
 * the diagnostic, reading/listening tasks and mock exams.
 *
 * Gap convention: the prompt contains exactly one "____" (4 underscores) where
 * the answer goes, except for kind "mcq" questions about a text, which may have none.
 */
export interface Question {
  id: string;
  skill: Skill;
  topic: Topic;
  level: Level;
  kind: "mcq" | "gap" | "transform";
  part?: UoEPart;
  /** The sentence / question shown to the learner. */
  prompt: string;
  /** mcq only: exactly the options shown, in order. */
  options?: string[];
  /** Accepted answers. mcq: the single correct option string. gap/transform: every acceptable variant (case-insensitive). */
  answers: string[];
  /** word-formation: the stem in CAPITALS, e.g. "COMPETE". */
  stem?: string;
  /** key-word transformation: the original sentence and the key word. The prompt is the second sentence with "____". */
  original?: string;
  keyword?: string;
  /** Why the answer is right (English, concise, teacherly). */
  explanation: string;
  /** Short Spanish note for a Spanish speaker (optional, used at lower levels). */
  explanationEs?: string;
  /** mcq: why each wrong option fails, keyed by the option text. */
  optionNotes?: Record<string, string>;
  /** Content theme. */
  theme?: ContentTopic;
}

// ───────────────────────────── Vocabulary ─────────────────────────────

export type VocabCategory =
  | "academic"
  | "c1"
  | "collocation"
  | "phrasal-verb"
  | "idiom"
  | "formal"
  | "informal"
  | "word-formation"
  | "confusing-words"
  | "topic";

export type Register = "formal" | "neutral" | "informal";

export interface VocabEntry {
  id: string;
  term: string;
  /** e.g. "verb", "noun", "phrasal verb", "idiom", "collocation" */
  pos: string;
  definition: string;
  /** Spanish explanation, including false-friend warnings where useful. */
  spanish: string;
  example: string;
  ipa?: string;
  synonyms: string[];
  antonyms?: string[];
  collocations: string[];
  register: Register;
  level: Level;
  category: VocabCategory;
  topic: ContentTopic;
}

/** Learner-side data for one vocabulary entry (built-in or custom). */
export interface VocabProgress {
  entryId: string;
  saved: boolean;
  personalExample?: string;
  /** SM-2 style scheduling */
  ease: number;
  interval: number; // days
  repetitions: number;
  due: string; // ISO date (yyyy-mm-dd)
  lapses: number; // times forgotten
  lastReviewed?: string;
  difficult?: boolean;
}

// ───────────────────────────── Reading & Listening ─────────────────────────────

export type ReadingGenre = "article" | "opinion" | "essay" | "report" | "review" | "fiction" | "academic" | "professional";

export interface ReadingText {
  id: string;
  title: string;
  genre: ReadingGenre;
  level: Level;
  theme: ContentTopic;
  /** Paragraphs of the text. For gapped-text tasks, a paragraph may contain "[[GAP:1]]" markers. */
  paragraphs: string[];
  /** Words a C1 learner may want to save, with short glosses. */
  glossary: { term: string; gloss: string }[];
  /** Comprehension questions (kind "mcq"). Topic is the sub-skill (main-idea, inference, attitude, detail, meaning-from-context, text-structure). */
  questions: Question[];
}

export type Accent = "British (RP)" | "American" | "Australian" | "Irish" | "Scottish" | "Canadian" | "Indian";

export interface ListeningSegment {
  speaker: string;
  /** BCP-47 voice hint for speechSynthesis, e.g. "en-GB", "en-US", "en-AU", "en-IE", "en-IN". */
  lang: string;
  /** 0.8–1.2, used to differentiate speakers when the same voice is reused. */
  pitch?: number;
  text: string;
}

export interface ListeningTrack {
  id: string;
  title: string;
  format: "conversation" | "interview" | "lecture" | "discussion" | "news" | "monologue";
  level: Level;
  theme: ContentTopic;
  accents: Accent[];
  context: string; // one-line situation description, as in the exam rubric
  segments: ListeningSegment[];
  /** Questions: mcq (topic detail/inference/attitude/main-idea) or gap (sentence completion, answers are words from the recording). */
  questions: Question[];
}

// ───────────────────────────── Writing & Speaking ─────────────────────────────

export type WritingGenre = "essay" | "report" | "review" | "proposal" | "letter" | "email";

export interface WritingTask {
  id: string;
  genre: WritingGenre;
  title: string;
  level: Level;
  theme: ContentTopic;
  /** Exam-style rubric/prompt. */
  prompt: string;
  /** Bullet points the answer must cover. */
  requirements: string[];
  wordRange: [number, number];
  minutes: number;
  register: Register;
  /** C1 expressions that suit this task. */
  usefulLanguage: string[];
  /** Keywords from the prompt used to check content coverage, one array per requirement. */
  contentKeywords: string[][];
  modelAnswer: string;
}

export type SpeakingPart = "interview" | "long-turn" | "collaborative" | "discussion";

export interface SpeakingTask {
  id: string;
  part: SpeakingPart;
  title: string;
  level: Level;
  theme: ContentTopic;
  /** Instructions as the examiner would say them. */
  instructions: string;
  /** Long turn: the visual scenes described in words (no images). Collaborative: the options. */
  prompts: string[];
  /** Guiding questions shown to the candidate. */
  questions: string[];
  prepSeconds: number;
  speakSeconds: number;
  usefulLanguage: string[];
  /** A short model response. */
  sample: string;
}

// ───────────────────────────── Lessons ─────────────────────────────

export interface Lesson {
  id: string;
  title: string;
  skill: Skill;
  topic: Topic;
  level: Level;
  theme: ContentTopic;
  minutes: number;
  objective: string;
  /** Short explanation (2–4 short paragraphs, markdown-lite: **bold** allowed). */
  explanation: string[];
  /** Optional Spanish summary for a Spanish speaker. */
  explanationEs?: string;
  examples: { sentence: string; note?: string }[];
  /** Guided practice with immediate feedback (4–6 items). */
  practice: Question[];
  /** Vocabulary notes for the lesson. */
  vocabulary: { term: string; meaning: string; example: string }[];
  /** Final mini-test (4–5 items, not seen in practice). */
  test: Question[];
}

// ───────────────────────────── Learner state ─────────────────────────────

export type EnglishVariety = "british" | "american" | "no-preference";

export interface Profile {
  name: string;
  motivation: string;
  examDate?: string; // ISO date
  daysPerWeek: number;
  /** Which weekdays (0 = Sunday … 6 = Saturday) are study days. */
  studyDays: number[];
  minutesPerDay: number;
  weakSkills: Skill[];
  strongSkills: Skill[];
  variety: EnglishVariety;
  /** 0 = lots of Spanish support, 1 = English only. Adapted automatically unless locked. */
  spanishSupport: "auto" | "more" | "less" | "off";
  createdAt: string;
}

/** Ability estimate per skill on the Cambridge English Scale (140–210). */
export interface SkillEstimate {
  score: number;
  /** Number of graded data points behind the estimate. */
  evidence: number;
  updatedAt: string;
  /** Ability history, one point per day it changed. */
  history: { date: string; score: number }[];
}

export type DiagnosticSection = "grammar" | "vocabulary" | "reading" | "useOfEnglish" | "listening" | "writing" | "speaking";

export interface DiagnosticState {
  /** Sections finished, with their resulting score. */
  completed: Partial<Record<DiagnosticSection, { score: number; correct: number; total: number; date: string }>>;
  /** In-progress section (resumable). */
  current?: {
    section: DiagnosticSection;
    ability: number;
    asked: string[];
    correct: number;
    total: number;
  };
  finishedAt?: string;
}

export interface Attempt {
  id: string;
  questionId: string;
  skill: Skill;
  topic: Topic;
  level: Level;
  correct: boolean;
  answer: string;
  date: string; // ISO datetime
  source: "lesson" | "use-of-english" | "reading" | "listening" | "diagnostic" | "mock" | "mistakes" | "vocabulary" | "drill";
}

export type Mastery = "new" | "learning" | "improving" | "mastered";

export interface Mistake {
  id: string; // = questionId
  questionId: string;
  /** Snapshot of the question so mistakes survive content changes. */
  prompt: string;
  original?: string;
  keyword?: string;
  stem?: string;
  options?: string[];
  yourAnswer: string;
  correctAnswer: string;
  explanation: string;
  skill: Skill;
  topic: Topic;
  level: Level;
  firstSeen: string;
  lastSeen: string;
  timesWrong: number;
  timesRightSince: number;
  mastery: Mastery;
  /** Next scheduled review (ISO date). */
  due: string;
}

export interface StudySession {
  id: string;
  date: string; // ISO datetime
  minutes: number;
  activity: "lesson" | "use-of-english" | "reading" | "listening" | "writing" | "speaking" | "vocabulary" | "mock" | "mistakes" | "diagnostic" | "tutor";
  skill?: Skill;
  title: string;
  score?: number; // 0–100 when applicable
}

export interface WritingCriterion {
  key: "content" | "communicative" | "organisation" | "language";
  label: string;
  band: number; // 0–5 (Cambridge-style subscale)
  comment: string;
}

export interface WritingFeedback {
  estimatedLevel: string;
  scaleScore: number;
  criteria: WritingCriterion[];
  /** Fine-grained checks shown under the rubric. */
  checks: { label: string; status: "good" | "ok" | "weak"; note: string }[];
  corrections: { original: string; suggestion: string; why: string }[];
  upgrades: { instead: string; try: string; why: string }[];
  strengths: string[];
  priorities: string[];
  source: "local" | "claude";
}

export interface WritingSubmission {
  id: string;
  taskId: string;
  text: string;
  wordCount: number;
  minutesSpent: number;
  date: string;
  status: "draft" | "submitted";
  feedback?: WritingFeedback;
}

export interface SpeakingSession {
  id: string;
  taskId: string;
  date: string;
  transcript: string;
  durationSec: number;
  mode: "voice" | "typed";
  selfRating?: number; // 1–5
  feedback?: {
    wordsPerMinute: number;
    uniqueWordRatio: number;
    linkers: string[];
    c1Phrases: string[];
    fillers: number;
    scores: { label: string; band: number; note: string }[];
    estimatedLevel: string;
    tips: string[];
  };
}

export interface MockResult {
  id: string;
  examId: string;
  date: string;
  mode: "exam" | "learning";
  papers: { paper: "reading-uoe" | "listening" | "writing" | "speaking"; correct: number; total: number; scale: number }[];
  overallScale: number;
  grade: string;
  minutes: number;
}

export interface PlanBlock {
  id: string;
  kind: "lesson" | "practice" | "review" | "vocabulary" | "maintenance" | "exam" | "writing" | "speaking" | "listening" | "reading";
  title: string;
  detail: string;
  minutes: number;
  skill?: Skill;
  topic?: Topic;
  href: string;
  /** Why the planner chose it. */
  reason: string;
}

export interface PlanOverrides {
  /** Day-specific skips: "yyyy-mm-dd" → block ids done/skipped. */
  skipped: Record<string, string[]>;
  done: Record<string, string[]>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "tutor";
  text: string;
  date: string;
  source?: "local" | "claude";
  /** Optional inline quiz (question ids) rendered under the message. */
  quiz?: string[];
  /** Optional quick links rendered as buttons. */
  links?: { label: string; href: string }[];
}
