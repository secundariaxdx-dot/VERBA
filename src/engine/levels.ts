import type { Level, Skill, Topic } from "@/domain/types";

/**
 * Ability is modelled on the Cambridge English Scale (an unofficial estimate):
 *   160–179 → B2, 180–199 → C1, 200+ → C2.
 * VERBA splits B2 into finer bands so progress is visible week to week.
 */
export const LEVEL_DIFFICULTY: Record<Level, number> = { B2: 166, "B2+": 173, C1: 184, "C1+": 194 };

export const C1_THRESHOLD = 180;
export const START_ABILITY = 172; // B2 First holder → start at B2+

export interface Band {
  label: string;
  short: string;
  min: number;
  description: string;
}

export const BANDS: Band[] = [
  { label: "B1", short: "B1", min: 0, description: "Independent user — below B2" },
  { label: "B2", short: "B2", min: 160, description: "Solid upper-intermediate" },
  { label: "B2+", short: "B2+", min: 169, description: "Strong B2, consolidating" },
  { label: "Approaching C1", short: "B2+→C1", min: 175, description: "Close to C1 — exam technique matters now" },
  { label: "C1", short: "C1", min: 180, description: "Advanced — C1 pass territory" },
  { label: "C1+", short: "C1+", min: 193, description: "Comfortable C1 — Grade A range" },
  { label: "C2", short: "C2", min: 200, description: "Proficient" },
];

export function bandFor(score: number): Band {
  let b = BANDS[0];
  for (const band of BANDS) if (score >= band.min) b = band;
  return b;
}

/** Nearest content level for a given ability. */
export function levelFor(score: number): Level {
  if (score >= 190) return "C1+";
  if (score >= 178) return "C1";
  if (score >= 169) return "B2+";
  return "B2";
}

/** Progress toward C1 from a B2 starting point (160 → 0 %, 180 → 100 %). */
export function progressToC1(score: number): number {
  return Math.max(0, Math.min(100, Math.round(((score - 160) / (C1_THRESHOLD - 160)) * 100)));
}

/** Unofficial C1 Advanced grade from a scale score. */
export function gradeFor(score: number): string {
  if (score >= 200) return "Grade A (C2 level) — estimate";
  if (score >= 193) return "Grade B — estimate";
  if (score >= 180) return "Grade C (C1 pass) — estimate";
  if (score >= 160) return "B2 certificate — estimate";
  return "Below exam range — estimate";
}

/** Convert a percentage on a C1-level paper into an approximate scale score. */
export function percentToScale(pct: number): number {
  // anchors: 45 % → 160, 60 % → 180, 75 % → 193, 80 % → 200 (approximation of how C1 papers convert)
  const anchors: [number, number][] = [
    [0, 142],
    [45, 160],
    [60, 180],
    [75, 193],
    [80, 200],
    [100, 210],
  ];
  for (let i = 1; i < anchors.length; i++) {
    const [p1, s1] = anchors[i - 1];
    const [p2, s2] = anchors[i];
    if (pct <= p2) return Math.round(s1 + ((pct - p1) / (p2 - p1)) * (s2 - s1));
  }
  return 210;
}

export const SKILLS: Skill[] = ["grammar", "vocabulary", "reading", "useOfEnglish", "listening", "writing", "speaking"];

export const SKILL_LABEL: Record<Skill, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  useOfEnglish: "Use of English",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export const TOPIC_LABEL: Record<Topic, string> = {
  inversion: "Inversion",
  conditionals: "Conditionals",
  passive: "Passive structures",
  "reported-speech": "Reported speech",
  articles: "Articles",
  prepositions: "Prepositions",
  "verb-patterns": "Verb patterns",
  modals: "Modal verbs",
  "relative-clauses": "Relative clauses",
  "cleft-sentences": "Cleft sentences",
  linking: "Linking expressions",
  collocations: "Collocations",
  "phrasal-verbs": "Phrasal verbs",
  "word-formation": "Word formation",
  idioms: "Idioms",
  register: "Register",
  "advanced-grammar": "Advanced grammar",
  tenses: "Tenses & aspect",
  vocabulary: "Vocabulary",
  "main-idea": "Main idea",
  detail: "Detail",
  inference: "Inference",
  attitude: "Attitude & purpose",
  "meaning-from-context": "Meaning from context",
  "text-structure": "Text structure",
};

/** The 17 Use of English concepts the learner asked to track. */
export const TRACKED_TOPICS: Topic[] = [
  "inversion",
  "conditionals",
  "passive",
  "reported-speech",
  "articles",
  "prepositions",
  "verb-patterns",
  "modals",
  "relative-clauses",
  "cleft-sentences",
  "linking",
  "collocations",
  "phrasal-verbs",
  "word-formation",
  "idioms",
  "register",
  "advanced-grammar",
];
