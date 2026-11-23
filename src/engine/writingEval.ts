import type { WritingFeedback, WritingTask } from "@/domain/types";
import { sentences, wordCount } from "@/lib/text";
import { bandFor } from "./levels";

/**
 * Local (offline) writing evaluator.
 *
 * It cannot "understand" an essay the way an examiner (or Claude) can, so it
 * measures what is measurable: task coverage via prompt keywords, length,
 * paragraphing and layout, cohesion devices, lexical range, register, and a
 * catalogue of errors typical of Spanish speakers. Every finding comes with an
 * explanation so the learner is taught, not just corrected.
 */

interface Rule {
  re: RegExp;
  fix: string | ((m: string) => string);
  why: string;
}

const ERROR_RULES: Rule[] = [
  { re: /\bdepends? of\b/gi, fix: (m) => m.replace(/of/i, "on"), why: "Depend takes “on” (not “of”, from Spanish “depender de”)." },
  { re: /\bdiscuss(?:ed|es|ing)? about\b/gi, fix: (m) => m.replace(/ about/i, ""), why: "Discuss is transitive: discuss something (no “about”)." },
  { re: /\bexplain(?:ed|s)? (me|us|him|her|them)\b/gi, fix: (m) => m.replace(/ (me|us|him|her|them)/i, (_x, p: string) => ` to ${p}`), why: "Explain something TO someone — “explain me” is a Spanish calque." },
  { re: /\bpeople is\b/gi, fix: "people are", why: "People is plural in English: people are / people have." },
  { re: /\bin the other hand\b/gi, fix: "on the other hand", why: "The fixed expression is “on the other hand”." },
  { re: /\baccording with\b/gi, fix: "according to", why: "The preposition is “to”: according to." },
  { re: /\bsince (\d+|two|three|four|five|six|several|many) (years|months|weeks|days)\b/gi, fix: (m) => m.replace(/since/i, "for"), why: "Use “for” with a period of time and “since” with a starting point (since 2019)." },
  { re: /\b(informations|advices|researches|evidences|knowledges|furnitures|equipments)\b/gi, fix: (m) => m.replace(/s$/i, ""), why: "This noun is uncountable in English — no plural -s (a piece of advice/information)." },
  { re: /\bmake (a )?(sport|sports|exercise)\b/gi, fix: (m) => m.replace(/make/i, "do"), why: "We “do” sport/exercise (hacer deporte → do sport)." },
  { re: /\bmake (a|some) questions?\b/gi, fix: (m) => m.replace(/make/i, "ask"), why: "We “ask” a question (not make)." },
  { re: /\bfor (to)\b/gi, fix: "to", why: "Purpose is expressed with “to + infinitive”, not “for to”." },
  { re: /(^|[.!?]\s+)is (important|necessary|essential|possible|clear)\b/g, fix: (m) => m.replace(/is/, "it is").replace(/^(\W*)it/, (_x, p: string) => `${p}It`), why: "English needs a subject: “It is important…” (Spanish drops it)." },
  { re: /\bthe (society|nature|life|people in general)\b(?! of| in| that| which| who)/gi, fix: (m) => m.replace(/^the /i, ""), why: "Abstract nouns used in a general sense take no article in English." },
  { re: /\bpeople which\b/gi, fix: "people who", why: "Use “who” (or “that”) for people, not “which”." },
  { re: /\b(could|should|would|must) of\b/gi, fix: (m) => m.replace(/of/i, "have"), why: "The structure is modal + have + past participle." },
  { re: /\bassist(?:ed|s)? to\b/gi, fix: (m) => m.replace(/assist/i, "attend").replace(/ to$/i, ""), why: "False friend: “asistir a” = attend. “Assist” means help." },
  { re: /\bactually\b(?=[^.]*\b(nowadays|these days|at the moment)\b)/gi, fix: "currently", why: "False friend: “actualmente” = currently. “Actually” means “in fact”." },
  { re: /\bmore (better|worse|easier|cheaper|bigger)\b/gi, fix: (m) => m.replace(/more /i, ""), why: "Don’t double the comparative: better, not more better." },
  { re: /\bthe most of (the )?\b/gi, fix: "most ", why: "“Most people” / “most of the people” — not “the most of”." },
  { re: /\bi\b/g, fix: "I", why: "The pronoun I is always a capital letter." },
  { re: /\bas a conclusion\b/gi, fix: "in conclusion", why: "The usual formula is “In conclusion” or “To conclude”." },
  { re: /\bcontrol(?:led)? the (exam|homework)\b/gi, fix: (m) => m.replace(/control(?:led)?/i, "check"), why: "False friend: “controlar” is often “check” or “monitor”." },
  { re: /\bin (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, fix: (m) => m.replace(/^in/i, "on"), why: "Days take “on”: on Monday." },
  { re: /\bpersons\b/gi, fix: "people", why: "The normal plural of person is people (“persons” is legalistic)." },
];

const BASIC_LINKERS = ["and", "but", "so", "because", "also", "then", "firstly", "secondly", "finally", "in conclusion", "for example", "however"];
const C1_LINKERS = [
  "moreover",
  "furthermore",
  "nevertheless",
  "nonetheless",
  "whereas",
  "albeit",
  "consequently",
  "therefore",
  "thus",
  "hence",
  "in addition",
  "on the other hand",
  "by contrast",
  "in contrast",
  "despite",
  "in spite of",
  "although",
  "even though",
  "while",
  "whilst",
  "as a result",
  "not only",
  "provided that",
  "given that",
  "to a large extent",
  "all things considered",
  "on balance",
  "that said",
  "in light of",
  "with regard to",
  "as far as",
  "admittedly",
  "notwithstanding",
  "by the same token",
  "it follows that",
  "to sum up",
  "overall",
  "ultimately",
];

const UPGRADES: { re: RegExp; try: string; why: string }[] = [
  { re: /\bvery important\b/i, try: "crucial / vital / of paramount importance", why: "Replace intensifier + adjective with a stronger single adjective." },
  { re: /\bvery big\b|\bbig\b/i, try: "substantial / considerable / significant", why: "“Big” is B1; C1 writing needs precise adjectives." },
  { re: /\bvery good\b/i, try: "excellent / outstanding / highly beneficial", why: "Show range instead of intensifying a basic adjective." },
  { re: /\bbad\b/i, try: "detrimental / harmful / counterproductive", why: "More precise and more formal." },
  { re: /\ba lot of\b/i, try: "a great deal of / a wide range of / numerous", why: "“A lot of” is informal for essays and reports." },
  { re: /\bthings?\b/i, try: "a specific noun: factors, issues, aspects, measures", why: "“Thing” is vague; examiners reward precise nouns." },
  { re: /\bget\b/i, try: "obtain / gain / acquire / become", why: "“Get” is versatile but informal; choose the exact meaning." },
  { re: /\bI think\b/i, try: "I would argue that / It seems to me that / I am convinced that", why: "Vary how you express opinions — C1 rewards hedging and stance." },
  { re: /\bin my opinion\b/i, try: "from my perspective / as I see it", why: "Avoid repeating the same opinion phrase." },
  { re: /\bshow\b/i, try: "illustrate / demonstrate / highlight", why: "Precise reporting verbs raise your Language mark." },
  { re: /\bhelp\b/i, try: "facilitate / foster / contribute to", why: "A more academic verb fits essays and proposals." },
  { re: /\bnowadays\b/i, try: "in today’s society / in recent years", why: "“Nowadays” as an opener is a cliché in exam essays." },
  { re: /\bpeople\b/i, try: "individuals / citizens / the general public / consumers", why: "Specify who you mean." },
  { re: /\bmany\b/i, try: "a considerable number of / countless", why: "Adds range; don’t overuse it though." },
];

const CONTRACTION_RE = /\b\w+(n't|'re|'ve|'ll|'d|'m)\b/gi;
const INFORMAL_RE = /\b(gonna|wanna|kinda|stuff|guys|ok|okay|super|really really|awesome|cool)\b/gi;

function clamp(n: number, a = 0, b = 5) {
  return Math.max(a, Math.min(b, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function evaluateWriting(text: string, task: WritingTask): WritingFeedback {
  const words = wordCount(text);
  const lower = text.toLowerCase();
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const sents = sentences(text);
  const sentLens = sents.map((s) => wordCount(s));
  const avgLen = sentLens.length ? sentLens.reduce((a, b) => a + b, 0) / sentLens.length : 0;
  const variance = sentLens.length ? Math.sqrt(sentLens.reduce((a, b) => a + (b - avgLen) ** 2, 0) / sentLens.length) : 0;
  const tokens = lower.match(/[a-z’']+/g) ?? [];
  const sample = tokens.slice(0, 220);
  const ttr = sample.length ? new Set(sample).size / sample.length : 0;
  const longWords = tokens.filter((t) => t.length >= 9).length / Math.max(1, tokens.length);

  // ── Content: coverage of each requirement
  const covered = task.contentKeywords.map((kws) => kws.some((k) => lower.includes(k.toLowerCase())));
  const coverage = covered.length ? covered.filter(Boolean).length / covered.length : 1;
  const [minW, maxW] = task.wordRange;
  const lengthOk = words >= minW - 10 && words <= maxW + 30;

  // ── Organisation
  const c1Linkers = C1_LINKERS.filter((l) => new RegExp(`\\b${l}\\b`, "i").test(text));
  const basicLinkers = BASIC_LINKERS.filter((l) => new RegExp(`\\b${l}\\b`, "i").test(text));
  const hasHeadings = paras.some((p) => p.length < 60 && !/[.!?]$/.test(p));
  const needsHeadings = task.genre === "report" || task.genre === "proposal";
  const hasGreeting = /^(dear|hi|hello)\b/i.test(text.trim());
  const hasSignOff = /(yours (sincerely|faithfully)|best wishes|kind regards|regards|all the best|best),?\s*\n?\s*\w*\s*$/i.test(text.trim());
  const needsLetterLayout = task.genre === "letter" || task.genre === "email";

  // ── Register
  const contractions = (text.match(CONTRACTION_RE) ?? []).length;
  const informal = [...new Set((text.match(INFORMAL_RE) ?? []).map((s) => s.toLowerCase()))];
  const formalTask = task.register === "formal";

  // ── Language: errors and upgrades
  const corrections: WritingFeedback["corrections"] = [];
  for (const r of ERROR_RULES) {
    if (!r.why) continue;
    const matches = text.match(r.re);
    if (!matches) continue;
    for (const m of matches.slice(0, 2)) {
      if (r.re.source === "\\bi\\b" && m === "I") continue;
      const suggestion = typeof r.fix === "function" ? r.fix(m) : r.fix;
      if (suggestion.trim() === m.trim()) continue;
      corrections.push({ original: m.trim(), suggestion: suggestion.trim(), why: r.why });
    }
  }
  const upgrades = UPGRADES.filter((u) => u.re.test(text))
    .slice(0, 6)
    .map((u) => ({ instead: (text.match(u.re)?.[0] ?? "").trim(), try: u.try, why: u.why }));
  const usedUseful = task.usefulLanguage.filter((p) => lower.includes(p.toLowerCase().replace(/[.…]+$/, "").split("/")[0].trim()));
  const errorsPer100 = (corrections.length / Math.max(1, words)) * 100;

  // ── Bands (0–5, Cambridge-style)
  const content = words < 40 ? 0 : clamp(1 + coverage * 3.5 + (lengthOk ? 0.5 : -0.5) - (words < minW * 0.6 ? 1.5 : 0));
  let comm = 2.2;
  if (formalTask) comm += contractions === 0 ? 0.8 : contractions <= 2 ? 0.2 : -0.8;
  else comm += 0.5;
  comm -= informal.length * (formalTask ? 0.5 : 0.1);
  if (needsLetterLayout) comm += (hasGreeting ? 0.5 : -0.5) + (hasSignOff ? 0.4 : -0.4);
  if (needsHeadings) comm += hasHeadings ? 0.7 : -0.5;
  comm += usedUseful.length >= 2 ? 0.8 : usedUseful.length * 0.3;
  comm += coverage >= 1 ? 0.4 : 0;
  const organisation = clamp(
    (paras.length >= 4 ? 2.2 : paras.length >= 3 ? 1.6 : paras.length === 2 ? 1 : 0.3) +
      Math.min(2, c1Linkers.length * 0.4) +
      (basicLinkers.length > 0 ? 0.3 : 0) +
      (variance > 5 ? 0.5 : 0.1) -
      (avgLen > 32 ? 0.6 : 0),
  );
  const language = clamp(
    1.2 + Math.min(1.6, (ttr - 0.45) * 6) + Math.min(1.2, longWords * 8) + (variance > 6 ? 0.5 : 0) + Math.min(0.8, usedUseful.length * 0.25) - Math.min(2, errorsPer100 * 0.6) - Math.max(0, upgrades.length - 3) * 0.2,
  );
  const commBand = clamp(comm);
  const bands = { content: round1(content), communicative: round1(commBand), organisation: round1(organisation), language: round1(language) };
  const avg = (bands.content + bands.communicative + bands.organisation + bands.language) / 4;
  const scaleScore = Math.round(Math.max(140, Math.min(205, 156 + avg * 8)));

  const status = (v: number): "good" | "ok" | "weak" => (v >= 3.5 ? "good" : v >= 2.5 ? "ok" : "weak");
  const checks: WritingFeedback["checks"] = [
    { label: "Task fulfilment", status: coverage >= 1 ? "good" : coverage >= 0.6 ? "ok" : "weak", note: covered.map((c, i) => `${c ? "✓" : "✗"} ${task.requirements[i] ?? "Point " + (i + 1)}`).join(" · ") },
    { label: "Word count", status: lengthOk ? "good" : words < minW * 0.8 ? "weak" : "ok", note: `${words} words (target ${minW}–${maxW}).` },
    { label: "Grammar", status: errorsPer100 < 0.5 ? "good" : errorsPer100 < 1.5 ? "ok" : "weak", note: corrections.length ? `${corrections.length} likely error${corrections.length > 1 ? "s" : ""} detected (see corrections).` : "No typical errors detected by the checker — proofread for tense and agreement anyway." },
    { label: "Vocabulary range", status: status(language), note: `Lexical variety ${Math.round(ttr * 100)} % · ${Math.round(longWords * 100)} % long words · ${usedUseful.length} C1 expression${usedUseful.length === 1 ? "" : "s"} from the task list.` },
    { label: "Cohesion", status: c1Linkers.length >= 4 ? "good" : c1Linkers.length >= 2 ? "ok" : "weak", note: c1Linkers.length ? `Advanced linkers used: ${c1Linkers.slice(0, 6).join(", ")}.` : "Mostly basic linkers — add contrast and consequence devices (nevertheless, consequently, whereas)." },
    { label: "Register", status: formalTask ? (contractions === 0 && !informal.length ? "good" : contractions <= 2 && !informal.length ? "ok" : "weak") : "good", note: formalTask ? `${contractions} contraction${contractions === 1 ? "" : "s"}${informal.length ? `; informal words: ${informal.join(", ")}` : ""}. This task needs a ${task.register} register.` : `A ${task.register} register suits this task.` },
    { label: "Organisation & layout", status: status(organisation), note: `${paras.length} paragraph${paras.length === 1 ? "" : "s"}${needsHeadings ? (hasHeadings ? ", headings present" : ", add headings") : ""}${needsLetterLayout ? (hasGreeting && hasSignOff ? ", greeting and sign-off present" : ", check greeting and sign-off") : ""}; average sentence length ${Math.round(avgLen)} words.` },
  ];

  const strengths: string[] = [];
  const priorities: string[] = [];
  if (coverage >= 1) strengths.push("You addressed every point in the task.");
  else priorities.push(`Cover every required point: ${task.requirements.filter((_, i) => !covered[i]).join("; ")}.`);
  if (c1Linkers.length >= 4) strengths.push("Good range of cohesive devices.");
  else priorities.push("Use 4–6 advanced linkers to signal contrast, addition and consequence.");
  if (paras.length >= 4) strengths.push("Clear paragraphing.");
  else priorities.push("Organise your answer into 4–5 paragraphs with one main idea each.");
  if (usedUseful.length >= 2) strengths.push(`You used task-specific C1 language (${usedUseful.slice(0, 3).join(", ")}).`);
  else priorities.push(`Try 2–3 C1 expressions for this genre, e.g. “${task.usefulLanguage.slice(0, 2).join("”, “")}”.`);
  if (formalTask && contractions > 0) priorities.push("Remove contractions — they lower the register of a formal piece.");
  if (corrections.length) priorities.push("Fix the recurring errors flagged below; they are typical of Spanish speakers and examiners notice them.");
  if (!lengthOk) priorities.push(words < minW ? "Develop your ideas further to reach the word count." : "Cut repetition to stay near the word limit.");

  return {
    estimatedLevel: bandFor(scaleScore).label,
    scaleScore,
    criteria: [
      { key: "content", label: "Content", band: bands.content, comment: coverage >= 1 ? "All required points appear to be covered." : `${Math.round(coverage * 100)} % of the required points detected.` },
      { key: "communicative", label: "Communicative achievement", band: bands.communicative, comment: `Register and conventions of a ${task.genre}${formalTask ? " (formal)" : ""}.` },
      { key: "organisation", label: "Organisation", band: bands.organisation, comment: `${paras.length} paragraphs, ${c1Linkers.length} advanced linking devices.` },
      { key: "language", label: "Language", band: bands.language, comment: `Range and accuracy: ${corrections.length} flagged error${corrections.length === 1 ? "" : "s"}, variety ${Math.round(ttr * 100)} %.` },
    ],
    checks,
    corrections: corrections.slice(0, 10),
    upgrades,
    strengths: strengths.length ? strengths : ["You completed a full draft — that is the hardest part."],
    priorities: priorities.slice(0, 4),
    source: "local",
  };
}
