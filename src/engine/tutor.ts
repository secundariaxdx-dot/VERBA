import type { ChatMessage, Topic } from "@/domain/types";
import type { VerbaData } from "@/store/verba";
import { GRAMMAR, USE_OF_ENGLISH, VOCABULARY, WRITING_TASKS, SPEAKING_TASKS, vocabQuestion } from "@/data";
import { SKILL_LABEL, TOPIC_LABEL, TRACKED_TOPICS, bandFor } from "./levels";
import { overallScore, strongestSkill, weakestSkill, weakTopics } from "./adaptive";
import { planForDay } from "./planner";
import { evaluateWriting } from "./writingEval";
import { todayISO } from "@/lib/dates";

/** Concise Spanish explanations of the tracked concepts (used by "explain in Spanish"). */
export const TOPIC_GUIDE_ES: Partial<Record<Topic, string>> = {
  inversion:
    "**Inversión**: tras una expresión negativa o restrictiva al principio de la frase (Never, Rarely, Seldom, Not only, No sooner, Hardly, Little, Only then, Not until, Under no circumstances), el verbo auxiliar va **antes** del sujeto, como en una pregunta.\n\n• Never **have I** seen such chaos.\n• Not only **did she** apologise, but she also paid.\n• No sooner **had we** arrived than it started to rain.\n\nTrampa típica: olvidar el auxiliar *do/does/did* en presente o pasado simple (*Not only she apologised* ✗).",
  conditionals:
    "**Condicionales**: en C1 se valoran las **mixtas** y las alternativas a *if*.\n\n• Mixta pasado→presente: If I **had studied** medicine, I **would be** a doctor now.\n• Mixta presente→pasado: If I **were** braver, I **would have** spoken up.\n• Alternativas: *provided/providing that, as long as, unless, otherwise, but for, suppose*.\n• Inversión formal: **Had I known**, … / **Were it** not for … / **Should you** need…\n\nOjo: nunca *would* en la cláusula con *if* (*If I would have* ✗).",
  passive:
    "**Pasiva avanzada**: para informar opiniones de forma impersonal.\n\n• It **is said that** the company is struggling.\n• The company **is said to be** struggling.\n• The ship **is thought to have sunk** in 1820 (infinitivo perfecto para el pasado).\n• Causativa: I **had/got** my car **repaired**.\n\nEquivale al «se dice que…» español, pero el inglés prefiere el sujeto personal + *to*.",
  "reported-speech":
    "**Estilo indirecto con verbos introductorios**: en C1 no basta con *said/told*.\n\n• advise/urge/warn/remind **someone to** do\n• suggest/recommend **doing** o **that** someone (should) do (¡nunca *suggest someone to*!)\n• deny/admit **doing**\n• apologise **for** doing, accuse someone **of** doing, blame someone **for**\n• insist **on** doing, object **to** doing",
  articles:
    "**Artículos**: el español usa *el/la* con sustantivos generales; el inglés **no**.\n\n• **Ø** Society, **Ø** life, **Ø** nature, **Ø** people in general.\n• *The* cuando es específico: **the** society of the 1920s.\n• Profesiones con *a/an*: She's **a** lawyer (en español sin artículo).\n• Instituciones: go to **Ø** school/hospital/prison (por su función) vs **the** school (el edificio).",
  prepositions:
    "**Preposiciones dependientes** que fallan a hispanohablantes:\n\n• depend **on** (no *of*), consist **of**, insist **on**, be married **to**, be interested **in**, arrive **at/in** (no *to*), dream **of/about**, be responsible **for**, be good **at**, think **of/about**.\n\nConsejo: apréndelas siempre como bloque verbo + preposición.",
  "verb-patterns":
    "**Patrones verbales**: algunos verbos van con *-ing*, otros con *to*, y algunos cambian de significado.\n\n• avoid/deny/risk/consider/postpone + **-ing**\n• afford/refuse/manage/threaten + **to**\n• remember/forget/stop/try/regret: **cambian de significado** (stop smoking = dejar; stop to smoke = parar para fumar).\n• Subjuntivo formal: It's essential that he **be** informed / I suggest that she **apply**.",
  modals:
    "**Modales de deducción en pasado**: modal + **have** + participio.\n\n• must have + pp = estoy seguro de que sí (*debe de haber…*).\n• can't/couldn't have + pp = estoy seguro de que no.\n• might/may/could have + pp = es posible.\n• should have + pp = debería haber (crítica).\n• needn't have + pp = lo hice y no era necesario ≠ didn't need to.",
  "relative-clauses":
    "**Relativos**: *who* (personas), *which* (cosas), *whose* (posesión), *where/when*.\n\n• Especificativas: sin comas, puedes usar *that*.\n• Explicativas: **con comas**, nunca *that*.\n• *which* puede referirse a toda la frase: He was late, **which** annoyed everyone.\n• Formal: the person **to whom** I spoke / **some of whom**, **none of which**.",
  "cleft-sentences":
    "**Oraciones escindidas (cleft)** para enfatizar:\n\n• **It was** Ana **who** found the error. (Fue Ana quien…)\n• **What** I need **is** more time. (Lo que necesito es…)\n• **All** I did **was** ask a question.\n• **The reason why** … **is that** …\n\nSon muy útiles en Speaking y Writing para sonar más natural y enfático.",
  linking:
    "**Conectores**: varía y usa los de C1.\n\n• Contraste: whereas, while, albeit (+ adjetivo/sintagma), nonetheless, notwithstanding.\n• Concesión: although / even though + frase; despite / in spite of + **nombre o -ing** (¡no *despite of*!).\n• Consecuencia: consequently, hence, thus, as a result.\n• Añadir: moreover, furthermore, what is more.",
  collocations:
    "**Colocaciones**: combinaciones naturales que no se traducen palabra por palabra.\n\n• **make** a decision/an effort/progress; **do** research/harm/business\n• **pay** attention, **raise** awareness, **meet** a deadline, **bridge** the gap\n• heavy traffic, strong coffee, **bitterly** disappointed, **highly** unlikely\n\nCompruébalo siempre en un diccionario de colocaciones.",
  "phrasal-verbs":
    "**Phrasal verbs**: en C1 se esperan los menos obvios y su uso en contexto.\n\n• come up with (idear), put forward (proponer), bring about (provocar), carry out (llevar a cabo), phase out (eliminar gradualmente), rule out (descartar), take on (asumir), set out to (proponerse).\n\nEn textos formales, combínalos con equivalentes latinos (rule out = exclude).",
  "word-formation":
    "**Formación de palabras**: identifica primero la **categoría** que falta (nombre, adjetivo, adverbio, verbo) y luego si hace falta **negativo** o **plural**.\n\n• Prefijos negativos: un-, in-, im-, ir-, il-, dis-, mis-.\n• Sufijos de nombre: -ment, -ness, -ity, -ance/-ence, -tion.\n• Adjetivos: -ive, -ous, -able/-ible, -al; adverbios: -ly.",
  idioms:
    "**Expresiones idiomáticas**: úsalas con moderación y en el registro adecuado (mejor en Speaking y textos informales).\n\n• a double-edged sword, the tip of the iceberg, a blessing in disguise, to sit on the fence, to be on the same page, to cut corners.",
  register:
    "**Registro**: adapta el lenguaje al lector.\n\n• Formal: sin contracciones, verbos latinos (obtain, require, assist), pasiva e impersonales (It is recommended that…).\n• Informal: contracciones, phrasal verbs, preguntas directas.\n• Error típico: mezclar ambos en la misma carta o informe.",
  "advanced-grammar":
    "**Gramática avanzada**: oraciones de participio (*Having finished…*, *Built in 1890, the house…*), *wish/if only*, *it's time + pasado*, *would rather + pasado*, énfasis con *do/did* (I **did** tell you!).",
};

const TOPIC_KEYWORDS: [RegExp, Topic][] = [
  [/inver/i, "inversion"],
  [/conditional|condicional|\bif\b/i, "conditionals"],
  [/passive|pasiva/i, "passive"],
  [/reported|indirect|estilo indirecto/i, "reported-speech"],
  [/article|artículo|\bthe\b|\ba\/an\b/i, "articles"],
  [/preposi/i, "prepositions"],
  [/verb pattern|gerund|infinitive|gerundio|infinitivo|subjunctive|subjuntivo/i, "verb-patterns"],
  [/modal|must have|might have|deduc/i, "modals"],
  [/relative|relativ|which|whose/i, "relative-clauses"],
  [/cleft|escindid|what i need/i, "cleft-sentences"],
  [/link|connector|conector|although|despite|whereas/i, "linking"],
  [/colloca|colocaci/i, "collocations"],
  [/phrasal/i, "phrasal-verbs"],
  [/word formation|formación de palabras|prefix|suffix|sufij|prefij/i, "word-formation"],
  [/idiom|expresi[oó]n idiom/i, "idioms"],
  [/register|registro|formal|informal/i, "register"],
];

function detectTopic(text: string): Topic | undefined {
  for (const [re, t] of TOPIC_KEYWORDS) if (re.test(text)) return t;
  return undefined;
}

function lastMistake(data: VerbaData) {
  return Object.values(data.mistakes).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))[0];
}

type Reply = Omit<ChatMessage, "id" | "date" | "role">;

/** Rule-based tutor used when no AI key is configured. */
export function localTutor(input: string, data: VerbaData): Reply {
  const text = input.trim();
  const lower = text.toLowerCase();
  const name = data.profile?.name || "there";

  // Why is this answer incorrect?
  if (/why.*(wrong|incorrect)|por qu[eé].*(mal|incorrect)|explain.*(mistake|error)/i.test(text)) {
    const m = lastMistake(data);
    if (!m) return { text: "You don't have any recorded mistakes yet. Do a Use of English set and ask me again — I'll explain the last one you got wrong.", source: "local", links: [{ label: "Use of English", href: "/use-of-english" }] };
    const es = TOPIC_GUIDE_ES[m.topic];
    return {
      text: `Your most recent mistake (${TOPIC_LABEL[m.topic]}):\n\n“${m.original ? m.original + " → " : ""}${m.prompt}”\n\nYou wrote **${m.yourAnswer || "(blank)"}**; the answer is **${m.correctAnswer}**.\n\n${m.explanation}${m.timesWrong > 1 ? `\n\nYou've missed this ${m.timesWrong} times, so it's scheduled for frequent review.` : ""}${es ? `\n\n— En español —\n${es.split("\n\n")[0]}` : ""}`,
      source: "local",
      links: [{ label: `Practise ${TOPIC_LABEL[m.topic]}`, href: `/use-of-english?topic=${m.topic}` }],
    };
  }

  // Explain X in Spanish
  if (/spanish|español|espanol|castellano|en español/i.test(text)) {
    const topic = detectTopic(text) ?? lastMistake(data)?.topic ?? weakTopics(data.attempts, Object.values(data.mistakes))[0]?.topic ?? "inversion";
    const guide = TOPIC_GUIDE_ES[topic];
    return {
      text: guide ? `${guide}\n\nWhen you're ready, try a few items in English.` : `I don't have a Spanish guide for ${TOPIC_LABEL[topic]} yet. Try one of: ${TRACKED_TOPICS.slice(0, 8).map((t) => TOPIC_LABEL[t]).join(", ")}.`,
      source: "local",
      links: [{ label: `Practise ${TOPIC_LABEL[topic]}`, href: `/use-of-english?topic=${topic}` }],
    };
  }

  // Similar questions
  if (/similar|more (questions|exercises)|give me \d+|preguntas parecidas/i.test(text)) {
    const topic = detectTopic(text) ?? lastMistake(data)?.topic ?? weakTopics(data.attempts, Object.values(data.mistakes))[0]?.topic ?? "collocations";
    const pool = [...USE_OF_ENGLISH, ...GRAMMAR].filter((q) => q.topic === topic);
    const quiz = pool.sort(() => Math.random() - 0.5).slice(0, 10).map((q) => q.id);
    return {
      text: quiz.length
        ? `Here ${quiz.length === 1 ? "is 1 question" : `are ${quiz.length} questions`} on **${TOPIC_LABEL[topic]}**. Answer them here; wrong answers go to My Mistakes automatically.`
        : `I don't have enough items on ${TOPIC_LABEL[topic]} in the offline bank. The full Use of English trainer has more.`,
      quiz,
      source: "local",
      links: [{ label: "Open the full trainer", href: `/use-of-english?topic=${topic}` }],
    };
  }

  // Difference between expressions
  const diff = text.match(/difference between ["“']?(.+?)["”']? and ["“']?(.+?)["”']?\??$/i) ?? text.match(/diferencia entre ["“']?(.+?)["”']? y ["“']?(.+?)["”']?\??$/i);
  if (diff) {
    const [a, b] = [diff[1].trim(), diff[2].trim()];
    const find = (t: string) => [...VOCABULARY, ...data.customVocab].find((v) => v.term.toLowerCase() === t.toLowerCase() || v.term.toLowerCase().includes(t.toLowerCase()));
    const ea = find(a);
    const eb = find(b);
    if (ea || eb) {
      const part = (e: typeof ea, t: string) => (e ? `**${e.term}** (${e.register}, ${e.level}): ${e.definition}\nExample: ${e.example}\nES: ${e.spanish}` : `**${t}**: not in your vocabulary bank — add it in Vocabulary with your own example.`);
      return { text: `${part(ea, a)}\n\n${part(eb, b)}\n\nTip: write one sentence of your own with each and save it as a personal example.`, source: "local" };
    }
    return {
      text: `I can't compare “${a}” and “${b}” offline because they aren't in the vocabulary bank. With the AI tutor enabled (ANTHROPIC_API_KEY on the server) I can explain any pair. Meanwhile, check a learner's dictionary for: meaning, register, typical collocations and grammar pattern — those four points are usually where the difference lies.`,
      source: "local",
    };
  }

  // Improve my essay
  if (/essay|writing|redacci|improve my/i.test(text)) {
    const sub = [...data.writing].sort((a, b) => b.date.localeCompare(a.date))[0];
    const task = sub && WRITING_TASKS.find((t) => t.id === sub.taskId);
    if (!sub || !task) return { text: "Write a draft in the Writing trainer first — then ask me again and I'll go through it with you.", source: "local", links: [{ label: "Writing trainer", href: "/writing" }] };
    const fb = sub.feedback ?? evaluateWriting(sub.text, task);
    const corr = fb.corrections.slice(0, 4).map((c) => `• “${c.original}” → “${c.suggestion}” — ${c.why}`).join("\n");
    const up = fb.upgrades.slice(0, 3).map((u) => `• Instead of “${u.instead}”, try ${u.try}.`).join("\n");
    return {
      text: `Your latest ${task.genre}, “${task.title}” (${sub.wordCount} words), is estimated at **${fb.estimatedLevel}** (${fb.scaleScore}, unofficial).\n\nPriorities:\n${fb.priorities.map((p) => "• " + p).join("\n")}${corr ? `\n\nCorrections:\n${corr}` : ""}${up ? `\n\nUpgrades:\n${up}` : ""}\n\nRewrite one paragraph applying these, rather than the whole text — then resubmit.`,
      source: "local",
      links: [{ label: "Open my draft", href: `/writing?id=${task.id}` }],
    };
  }

  // Practise speaking
  if (/speak|hablar|conversation|conversaci/i.test(text)) {
    const t = SPEAKING_TASKS[Math.floor(Math.random() * SPEAKING_TASKS.length)];
    return {
      text: `Let's do a ${t.part.replace("-", " ")} task: **${t.title}**.\n\n${t.instructions}\n\n${t.questions.map((q) => "• " + q).join("\n")}\n\nUse the Speaking trainer to record yourself with a timer — or type your answer here and I'll comment on range and linking.`,
      source: "local",
      links: [{ label: "Open in Speaking trainer", href: `/speaking?id=${t.id}` }],
    };
  }

  // Vocabulary quiz
  if (/quiz|vocab|word|palabra/i.test(text)) {
    const saved = Object.values(data.vocab).filter((v) => v.saved);
    const pick = (saved.length >= 5 ? saved.sort((a, b) => b.lapses - a.lapses || a.due.localeCompare(b.due)) : [])
      .map((p) => VOCABULARY.find((v) => v.id === p.entryId))
      .filter(Boolean)
      .slice(0, 6) as typeof VOCABULARY;
    const entries = pick.length >= 4 ? pick : [...VOCABULARY].sort(() => Math.random() - 0.5).slice(0, 6);
    return {
      text: pick.length >= 4 ? "A quick quiz on your saved words — the ones you forget most come first." : "A quick quiz on C1 vocabulary (save words in Vocabulary to get quizzes on your own list).",
      quiz: entries.map((e) => vocabQuestion(e).id),
      source: "local",
    };
  }

  // Study session for today
  if (/study session|today|plan|hoy|sesi[oó]n/i.test(text)) {
    const plan = planForDay(data, todayISO());
    if (!plan.isStudyDay) return { text: "Today is a rest day in your plan. If you want to study anyway, a 15-minute review is the best use of the time.", source: "local", links: [{ label: "Review vocabulary", href: "/vocabulary?mode=review" }] };
    return {
      text: `Here's today's session (${plan.minutes} min):\n\n${plan.blocks.map((b, i) => `${i + 1}. **${b.title}** — ${b.minutes} min\n   ${b.reason}`).join("\n")}`,
      source: "local",
      links: plan.blocks.slice(0, 3).map((b) => ({ label: b.title.length > 34 ? b.title.slice(0, 32) + "…" : b.title, href: b.href })),
    };
  }

  // Level / progress
  if (/level|nivel|progress|progreso|ready|preparad/i.test(lower)) {
    const o = overallScore(data.levels);
    return {
      text: `Overall you're at **${bandFor(o).label}** (${Math.round(o)} on the Cambridge scale — an unofficial estimate). Strongest: ${SKILL_LABEL[strongestSkill(data.levels)]}. Weakest: ${SKILL_LABEL[weakestSkill(data.levels)]}. ${o >= 180 ? "You're in C1 pass territory — now it's about consistency under exam conditions." : `You need roughly ${Math.ceil(180 - o)} more points to reach C1; the plan focuses on your weakest skill first.`}`,
      source: "local",
      links: [{ label: "Statistics", href: "/statistics" }],
    };
  }

  return {
    text: `I'm your offline tutor, ${name}. I can:\n\n• explain why your last answer was wrong\n• explain a grammar rule in Spanish (e.g. “explain inversion in Spanish”)\n• give you 10 similar questions\n• compare two expressions (“difference between X and Y”)\n• review your latest essay\n• start a speaking task\n• quiz you on vocabulary\n• build today's study session\n\nFor open-ended conversation, enable the AI tutor by adding ANTHROPIC_API_KEY on the server.`,
    source: "local",
  };
}

/** Compact learner context sent to the AI tutor (only when it is enabled). */
export function tutorContext(data: VerbaData): string {
  const levels = Object.entries(data.levels)
    .map(([k, v]) => `${SKILL_LABEL[k as keyof typeof SKILL_LABEL]} ${bandFor(v.score).label} (${Math.round(v.score)})`)
    .join(", ");
  const weak = weakTopics(data.attempts, Object.values(data.mistakes))
    .map((w) => `${TOPIC_LABEL[w.topic]} (${w.openMistakes} open, ${w.repeated} repeated)`)
    .join("; ");
  const recent = Object.values(data.mistakes)
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 6)
    .map((m) => `- [${TOPIC_LABEL[m.topic]}] ${m.original ? m.original + " → " : ""}${m.prompt} | learner: "${m.yourAnswer}" | correct: "${m.correctAnswer}"`)
    .join("\n");
  const difficult = Object.values(data.vocab)
    .filter((v) => v.saved && v.difficult)
    .map((v) => [...VOCABULARY, ...data.customVocab].find((e) => e.id === v.entryId)?.term)
    .filter(Boolean)
    .slice(0, 15)
    .join(", ");
  const plan = planForDay(data, todayISO());
  const p = data.profile;
  return [
    `Learner: ${p?.name ?? "learner"}, Spanish native speaker, holds B2 First, preparing for Cambridge C1 Advanced.`,
    `Motivation: ${p?.motivation ?? "n/a"}. Exam date: ${p?.examDate ?? "not set"}. Study: ${p?.minutesPerDay ?? 45} min/day, ${p?.daysPerWeek ?? 5} days/week. Preferred variety: ${p?.variety ?? "british"}.`,
    `Estimated levels (unofficial): ${levels}. Overall ${Math.round(overallScore(data.levels))}.`,
    `Weak topics: ${weak || "not enough data yet"}.`,
    `Recent mistakes:\n${recent || "none yet"}`,
    `Words the learner keeps forgetting: ${difficult || "none yet"}.`,
    `Today's plan: ${plan.blocks.map((b) => b.title).join(" | ") || "rest day"}.`,
    `Spanish support preference: ${p?.spanishSupport ?? "auto"}.`,
  ].join("\n");
}
