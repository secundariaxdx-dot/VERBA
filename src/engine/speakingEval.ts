import type { SpeakingSession, SpeakingTask } from "@/domain/types";
import { wordCount } from "@/lib/text";
import { bandFor } from "./levels";

const LINKERS = ["however", "whereas", "on the other hand", "while", "although", "what's more", "moreover", "besides", "that said", "having said that", "so", "because", "therefore", "as a result", "in contrast", "similarly", "likewise", "for instance", "for example", "in fact", "actually", "mind you", "all in all", "to be honest", "if you ask me", "as far as i'm concerned", "i'd say", "personally"];
const C1_PHRASES = ["it could be that", "i'd imagine", "presumably", "it looks as if", "it looks as though", "judging by", "they might well", "it's hard to say", "i'm inclined to think", "there's a lot to be said for", "by and large", "on balance", "to a certain extent", "it strikes me", "it's worth bearing in mind", "the way i see it", "i couldn't agree more", "i take your point", "that's a fair point", "i'm not entirely convinced", "when it comes to", "not to mention", "in the long run", "it goes without saying", "it depends on", "if anything", "whereas", "whilst"];
const FILLERS = /\b(um+|uh+|erm+|er|like,|you know|i mean|sort of|kind of)\b/gi;

export function evaluateSpeaking(transcript: string, durationSec: number, task: SpeakingTask, mode: "voice" | "typed"): NonNullable<SpeakingSession["feedback"]> {
  const words = wordCount(transcript);
  const lower = transcript.toLowerCase().replace(/’/g, "'");
  const minutes = Math.max(durationSec, 1) / 60;
  const wpm = mode === "voice" ? Math.round(words / minutes) : 0;
  const tokens = lower.match(/[a-z']+/g) ?? [];
  const uniqueRatio = tokens.length ? new Set(tokens.slice(0, 150)).size / Math.min(150, tokens.length) : 0;
  const linkers = LINKERS.filter((l) => new RegExp(`\\b${l.replace(/'/g, "'")}\\b`).test(lower));
  const taskPhrases = task.usefulLanguage.map((p) => p.toLowerCase().replace(/[.…]+$/, "").split("/")[0].trim());
  const c1 = [...new Set([...C1_PHRASES, ...taskPhrases].filter((p) => p.length > 3 && lower.includes(p)))];
  const fillers = (lower.match(FILLERS) ?? []).length;
  const expectedWords = (task.speakSeconds / 60) * 130;

  const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n * 10) / 10));
  const lengthRatio = Math.min(1.2, words / Math.max(30, expectedWords));
  const fluency = mode === "voice" ? clamp(1 + (wpm >= 100 ? 2 : wpm >= 75 ? 1.3 : 0.6) + lengthRatio * 1.5 - Math.min(1.5, fillers * 0.15)) : clamp(1 + lengthRatio * 3);
  const vocab = clamp(1 + (uniqueRatio - 0.45) * 6 + Math.min(1.8, c1.length * 0.45));
  const coherence = clamp(1 + Math.min(2.5, linkers.length * 0.5) + lengthRatio);
  const grammar = clamp(2 + (words > 60 ? 0.8 : 0) + (/\b(would have|had been|were to|should .* have|not only|rarely|seldom)\b/.test(lower) ? 1 : 0) + (/\b(which|who|whose)\b/.test(lower) ? 0.5 : 0) - (/\bpeople is\b|\bdepend of\b|\bexplain me\b/.test(lower) ? 1 : 0));
  const scores = [
    { label: "Fluency & length", band: fluency, note: mode === "voice" ? `${wpm} words per minute, ${words} words, ${fillers} filler${fillers === 1 ? "" : "s"}.` : `${words} words written as a spoken answer (fluency estimated from length only).` },
    { label: "Grammatical resource", band: grammar, note: "Complex structures (conditionals, relative clauses, inversion) raise this mark." },
    { label: "Lexical resource", band: vocab, note: `${Math.round(uniqueRatio * 100)} % variety · ${c1.length} C1 phrase${c1.length === 1 ? "" : "s"}.` },
    { label: "Discourse management", band: coherence, note: linkers.length ? `Linkers: ${linkers.slice(0, 6).join(", ")}.` : "Few linking phrases — connect ideas with whereas, that said, what’s more." },
  ];
  const avg = scores.reduce((s, x) => s + x.band, 0) / scores.length;
  const scale = Math.round(156 + avg * 8);
  const tips: string[] = [];
  if (words < expectedWords * 0.7) tips.push(`Aim for about ${Math.round(expectedWords)} words in ${task.speakSeconds} seconds — keep talking until the timer ends.`);
  if (c1.length < 2) tips.push(`Use phrases from the task list, e.g. “${task.usefulLanguage.slice(0, 2).join("”, “")}”.`);
  if (linkers.length < 3) tips.push("Compare explicitly: “whereas the first picture…, the second…”.");
  if (fillers > 4) tips.push("Replace fillers with thinking phrases: “That’s an interesting question…”, “Let me think…”.");
  if (task.part === "long-turn") tips.push("Speculate, don’t describe: “They might well be…”, “It looks as though…”.");
  if (!tips.length) tips.push("Strong answer. Next time, add one personal example to support an abstract point.");
  return { wordsPerMinute: wpm, uniqueWordRatio: Math.round(uniqueRatio * 100) / 100, linkers, c1Phrases: c1, fillers, scores, estimatedLevel: bandFor(scale).label, tips };
}
