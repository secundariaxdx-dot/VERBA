import type { Lesson, Question, Skill, Topic, Level, ContentTopic } from "@/domain/types";

/**
 * Original VERBA daily lessons. Small builders keep the question objects
 * consistent (skill/topic/level/theme, gap convention, optionNotes).
 */
function qb(skill: Skill, topic: Topic, level: Level, theme: ContentTopic) {
  return {
    /** notes = reasons for each WRONG option, in the order they appear in options. */
    mcq(id: string, prompt: string, options: string[], correct: number, notes: string[], explanation: string, explanationEs: string): Question {
      const optionNotes: Record<string, string> = {};
      let n = 0;
      options.forEach((o, i) => {
        if (i !== correct) optionNotes[o] = notes[n++];
      });
      return { id, skill, topic, level, kind: "mcq", prompt, options, answers: [options[correct]], explanation, explanationEs, optionNotes, theme };
    },
    gap(id: string, prompt: string, answers: string[], explanation: string, explanationEs: string, stem?: string): Question {
      const q: Question = { id, skill, topic, level, kind: "gap", prompt, answers, explanation, explanationEs, theme };
      if (stem) {
        q.stem = stem;
        q.part = "word-formation";
      } else if (skill === "useOfEnglish") {
        q.part = "open-cloze";
      }
      return q;
    },
    tr(id: string, original: string, keyword: string, prompt: string, answers: string[], explanation: string, explanationEs: string): Question {
      return { id, skill: "useOfEnglish", topic, level, kind: "transform", part: "key-word-transformation", prompt, original, keyword, answers, explanation, explanationEs, theme };
    },
  };
}

// ───────────────────────────── 1. Inversion ─────────────────────────────
const L01: Lesson = (() => {
  const p = qb("grammar", "inversion", "C1", "work");
  const t = qb("grammar", "inversion", "C1", "work");
  return {
    id: "lesson-01",
    title: "Inversion after negative adverbials",
    skill: "grammar",
    topic: "inversion",
    level: "C1",
    theme: "work",
    minutes: 15,
    objective: "Use inverted word order after negative and restrictive adverbials to sound emphatic and formal.",
    explanation: [
      "When a sentence opens with a negative or restrictive adverbial, the auxiliary verb moves in front of the subject: **Never have I** seen such a mess. The meaning does not change; the effect is emphasis and a formal, written tone.",
      "Common triggers: **never, rarely, seldom, hardly … when, scarcely … when, no sooner … than, not only … but also, under no circumstances, at no point, little, only when / only after / only by, not until**.",
      "If the verb has no auxiliary, add **do / does / did** and use the base form: Rarely **does she complain**. Not only **did he lie**, he also tried to cover it up. With hardly / no sooner, use the past perfect: **Hardly had we sat down when** the phone rang.",
      "Use inversion sparingly. One well-placed example in an essay or report is impressive; five in a paragraph sounds artificial.",
    ],
    explanationEs: "En español el orden no cambia (“Nunca he visto…”); en inglés, tras un adverbio negativo al inicio, debes invertir sujeto y auxiliar: Never have I seen…, no “Never I have seen”. Y recuerda: sin auxiliar, añade do/does/did.",
    examples: [
      { sentence: "Never have I worked with such a demanding client.", note: "Present perfect: have comes before the subject." },
      { sentence: "Rarely does a company recover so quickly from a scandal.", note: "No auxiliary in the base sentence, so does is added; the verb returns to the base form." },
      { sentence: "No sooner had she sent the report than the client called.", note: "No sooner + past perfect, followed by than (not when)." },
      { sentence: "Under no circumstances should employees share their passwords.", note: "Typical in rules and formal notices." },
      { sentence: "Only after the merger did the staff realise how much would change.", note: "Only after + clause triggers inversion in the main clause." },
      { sentence: "Not only did he arrive late, but he also forgot the contract.", note: "Inversion applies to the first clause only." },
    ],
    practice: [
      p.mcq("lesson-01-p1", "Hardly ____ the meeting begun when the fire alarm sounded.", ["had", "did", "would", "has"], 0, ["Hardly takes the past perfect, not did.", "Would does not fit a completed past sequence.", "Has is present perfect; the story is in the past."], "Hardly + past perfect inversion: Hardly had … when …", "Hardly + had + sujeto + participio, seguido de when."),
      p.gap("lesson-01-p2", "Rarely ____ employees receive such generous bonuses.", ["do"], "No auxiliary in the plain sentence (employees receive), so do is inserted before the subject.", "Sin auxiliar previo, se añade do: Rarely do employees receive…"),
      p.mcq("lesson-01-p3", "Under no circumstances ____ the door be left unlocked.", ["should", "must it", "does", "it should"], 0, ["Must it adds a spare pronoun; the subject is the door.", "Does cannot combine with be + past participle.", "Inversion is required, so the subject cannot come first."], "Under no circumstances + modal + subject: should the door be left … (inversion with the modal).", "Tras under no circumstances, el modal va antes del sujeto."),
      p.tr("lesson-01-p4", "I had never seen such chaos in an office.", "NEVER", "Never ____ such chaos in an office.", ["have i seen"], "Never at the start triggers inversion: have + subject + past participle.", "Never + have + I + seen."),
      p.tr("lesson-01-p5", "She not only wrote the report but also presented it.", "ONLY", "Not only ____ the report, but she also presented it.", ["did she write"], "Not only + did + subject + base verb. Note the verb is write, not wrote.", "Not only did she write (verbo en base)."),
    ],
    vocabulary: [
      { term: "come under scrutiny", meaning: "to be examined very carefully, often critically", example: "The firm’s accounts came under scrutiny after the scandal." },
      { term: "accountability", meaning: "the obligation to explain and take responsibility for one’s actions", example: "Shareholders are demanding greater accountability from the board." },
      { term: "ramifications", meaning: "complicated, often unwelcome consequences", example: "The ramifications of the resignation were felt across the industry." },
      { term: "whistle-blower", meaning: "a person who exposes wrongdoing inside an organisation", example: "The whistle-blower alerted the regulator to the fraud." },
      { term: "disclose", meaning: "to reveal information that was secret or private", example: "Employees must disclose any conflict of interest." },
    ],
    test: [
      t.mcq("lesson-01-t1", "Little ____ the manager know that the auditors were already in the building.", ["did", "had", "does", "would"], 0, ["Little here needs a past-tense auxiliary; had would require a past participle.", "Does is present; the narrative is past.", "Would suggests a hypothetical, not a fact."], "Little did + subject + base verb: a literary pattern meaning “had no idea”.", "Little did he know… es la estructura para “ni se imaginaba”."),
      t.gap("lesson-01-t2", "No sooner had the CEO announced the cuts ____ the share price fell.", ["than"], "No sooner is always paired with than; hardly / scarcely take when.", "No sooner … than; hardly … when."),
      t.tr("lesson-01-t3", "You must not, under any circumstances, open this file.", "CIRCUMSTANCES", "Under no ____ open this file.", ["circumstances must you", "circumstances should you"], "Under no circumstances + modal + subject + base verb.", "Under no circumstances + modal + sujeto."),
      t.mcq("lesson-01-t4", "Which sentence is correct?", ["Seldom has the company reported such losses.", "Seldom the company has reported such losses.", "Seldom has reported the company such losses.", "Seldom the company reported has such losses."], 0, ["No inversion: the auxiliary must precede the subject.", "The subject must stay between the auxiliary and the participle.", "The word order is scrambled."], "Seldom + auxiliary + subject + past participle.", "Seldom + has + sujeto + participio."),
      t.tr("lesson-01-t5", "He didn’t realise his mistake until he read the email again.", "UNTIL", "Not ____ he read the email again did he realise his mistake.", ["until"], "Not until + clause, then inversion in the main clause (did he realise).", "Not until … did he realise."),
    ],
  };
})();

// ───────────────────────────── 2. Mixed conditionals ─────────────────────────────
const L02: Lesson = (() => {
  const p = qb("grammar", "conditionals", "B2+", "health");
  const t = qb("grammar", "conditionals", "C1", "health");
  return {
    id: "lesson-02",
    title: "Mixed conditionals and alternatives to “if”",
    skill: "grammar",
    topic: "conditionals",
    level: "B2+",
    theme: "health",
    minutes: 14,
    objective: "Use mixed conditionals and formal alternatives to “if” to link past causes with present results.",
    explanation: [
      "A mixed conditional crosses time frames. **Past cause, present result:** If + past perfect, would + base verb — If I **had taken** the job, I **would be living** in Madrid now. **Present state, past result:** If + past simple, would have + past participle — If she **weren’t** so cautious, she **would have signed** it.",
      "Alternatives to if: **unless** (= if … not), **provided / providing (that), as long as, on condition that, supposing, but for + noun** (But for your help, we would have failed), **otherwise** (Take the pills; otherwise you’ll relapse).",
      "Formal inversion replaces if: **Had I known** (= If I had known), **Were he to resign** (= If he resigned), **Should you need** help (= If you need help).",
      "Never use will / would in the if-clause: ✗ If I would have known. ✓ If I had known.",
    ],
    explanationEs: "Trampa clásica: unless ya es negativo, así que “unless you don’t…” es incorrecto. Y “if I would have” (calco del condicional) debe ser if I had (pluscuamperfecto de subjuntivo español: “si hubiera”).",
    examples: [
      { sentence: "If I had listened to my doctor, I wouldn’t be in this situation now.", note: "Past cause, present result." },
      { sentence: "If he weren’t so reckless, he wouldn’t have ended up in hospital.", note: "Present trait, past result." },
      { sentence: "You can leave the clinic provided that you rest for a week.", note: "Provided that = only if." },
      { sentence: "But for the paramedics, he would not have survived.", note: "But for + noun = if it hadn’t been for." },
      { sentence: "Had she attended the screening, the tumour would have been found earlier.", note: "Formal inversion of if she had attended." },
      { sentence: "Should symptoms persist, consult your GP.", note: "Should + subject replaces If symptoms persist." },
    ],
    practice: [
      p.mcq("lesson-02-p1", "If she had followed the doctor’s advice, she ____ so unwell now.", ["wouldn’t be", "wouldn’t have been", "hadn’t been", "won’t be"], 0, ["Result is now, so the main clause needs would + base, not perfect.", "Hadn’t been is a past perfect form, not a result clause.", "Won’t is real future and does not fit a hypothetical."], "Past cause (past perfect) + present result (would + base).", "Causa en el pasado, resultado en el presente: would + infinitivo."),
      p.gap("lesson-02-p2", "You can borrow my car ____ you promise to drive carefully.", ["provided", "providing", "as long as", "so long as", "on condition that"], "Provided (that) / as long as introduce a condition that must be met.", "Provided that / as long as = con tal de que."),
      p.mcq("lesson-02-p3", "____ for the nurse’s quick reaction, the patient would have died.", ["But", "Unless", "Except", "If not"], 0, ["Unless needs a full clause, not for + noun.", "Except does not form a conditional.", "If not for would need to be if it were not for."], "But for + noun = if it hadn’t been for.", "But for + sustantivo = de no haber sido por."),
      p.tr("lesson-02-p4", "If you don’t exercise regularly, you will feel tired.", "UNLESS", "You will feel tired ____ regularly.", ["unless you exercise"], "Unless means if … not, so the verb stays positive.", "Unless ya es negativo: no “unless you don’t”."),
      p.tr("lesson-02-p5", "If I had known about the side effects, I wouldn’t have taken the pills.", "HAD", "____ about the side effects, I wouldn’t have taken the pills.", ["had i known"], "Drop if and invert had + subject.", "Inversión formal: Had I known…"),
    ],
    vocabulary: [
      { term: "relapse", meaning: "a return of illness after a period of improvement", example: "Stress can trigger a relapse." },
      { term: "side effect", meaning: "an unwanted effect of a drug or treatment", example: "Drowsiness is a common side effect." },
      { term: "chronic", meaning: "lasting a long time or constantly recurring", example: "She suffers from chronic back pain." },
      { term: "recuperate", meaning: "to recover from illness or exhaustion", example: "He needs two weeks to recuperate." },
      { term: "preventive", meaning: "intended to stop something happening", example: "Preventive care is cheaper than treatment." },
    ],
    test: [
      t.mcq("lesson-02-t1", "If he ____ so stubborn, he would have asked for help months ago.", ["weren’t", "hadn’t been", "wouldn’t be", "isn’t"], 0, ["Had not been would make the if-clause past, but his stubbornness is a present trait.", "Wouldn’t cannot appear in an if-clause.", "Isn’t is real present and does not match would have asked."], "Present state (weren’t) + past result (would have asked).", "Rasgo presente + resultado pasado: If he weren’t… would have asked."),
      t.gap("lesson-02-t2", "____ you need further information, please contact our clinic.", ["should"], "Should + subject is a formal alternative to If you need.", "Should you need = si necesitara."),
      t.tr("lesson-02-t3", "If it weren’t for her support, he wouldn’t have recovered so quickly.", "BUT", "____ her support, he wouldn’t have recovered so quickly.", ["but for"], "But for + noun = if it had not been for.", "But for + sustantivo."),
      t.mcq("lesson-02-t4", "Which sentence is correct?", ["Unless you take the medication, you won’t get better.", "Unless you don’t take the medication, you won’t get better.", "If you wouldn’t take the medication, you won’t get better.", "Unless you will take the medication, you won’t get better."], 0, ["Unless already means if … not.", "Would does not belong in the if-clause.", "Will does not belong in the unless-clause."], "Unless + present simple, with a positive verb.", "Unless + presente en afirmativo."),
      t.tr("lesson-02-t5", "What would you do if you were offered a job abroad?", "SUPPOSING", "____ a job abroad, what would you do?", ["supposing you were offered", "supposing you got offered"], "Supposing + past simple = if you were offered.", "Supposing = imagina que."),
    ],
  };
})();

// ───────────────────────────── 3. Advanced passives ─────────────────────────────
const L03: Lesson = (() => {
  const p = qb("grammar", "passive", "B2+", "current-affairs");
  const t = qb("grammar", "passive", "C1", "current-affairs");
  return {
    id: "lesson-03",
    title: "Advanced passives: “It is said that…” and “is thought to have…”",
    skill: "grammar",
    topic: "passive",
    level: "B2+",
    theme: "current-affairs",
    minutes: 14,
    objective: "Use impersonal passive reporting structures to present claims and rumours in a formal, journalistic style.",
    explanation: [
      "With reporting verbs (say, believe, think, report, know, expect, consider, claim, allege, understand) you have two passive patterns. **It is said that** + clause: It is said that the minister resigned. **Subject + is said to** + infinitive: The minister **is said to have resigned**.",
      "The infinitive shows time. **to be / to be doing** = same time as the reporting verb; **to have + past participle** = earlier. The mayor is believed **to be** abroad. The mayor is believed **to have left** last week.",
      "Related structures: causative **have / get something done** (She had her phone stolen), passive with modals (The law must be seen to be fair), **be to** for official plans (The summit is to take place in May), and **being + past participle** (He hates being told what to do).",
      "Use these patterns when the source is unknown, unimportant or deliberately vague, as in news reports and formal writing.",
    ],
    explanationEs: "“Se dice que…” es fácil en español, pero en inglés no se puede decir “He is said that…”. Elige: It is said that he… o He is said to + infinitivo. Para el pasado usa to have + participio.",
    examples: [
      { sentence: "The company is alleged to have misled investors.", note: "Earlier action: to have + past participle." },
      { sentence: "It is widely believed that the talks will fail.", note: "It + passive + that-clause." },
      { sentence: "The President is expected to announce new measures tomorrow.", note: "Future time handled by expected + to." },
      { sentence: "The refugees are understood to be living in temporary shelters.", note: "Same time as the reporting: to be + -ing." },
      { sentence: "She had her passport stolen on the train.", note: "Causative with negative experience." },
      { sentence: "Nobody likes being lied to by politicians.", note: "Passive gerund after like." },
    ],
    practice: [
      p.mcq("lesson-03-p1", "The minister is thought ____ the documents before the vote.", ["to have seen", "to see", "having seen", "that he has seen"], 0, ["To see refers to the same time as thought, but the viewing came first.", "Having seen does not follow be thought.", "That he has seen is a clause and cannot follow is thought."], "Earlier action = to have + past participle.", "Acción anterior: to have + participio."),
      p.gap("lesson-03-p2", "The company is alleged ____ have misled investors.", ["to"], "Be alleged + to + infinitive.", "Is alleged to have…"),
      p.mcq("lesson-03-p3", "The bridge ____ built in 1890.", ["is believed to have been", "is believed to be", "believes to have been", "is believed that was"], 0, ["To be would say it is built now.", "Believes is active; the bridge cannot believe.", "That was needs a subject: It is believed that it was."], "Passive of past reference: is believed to have been + participle.", "is believed to have been built."),
      p.tr("lesson-03-p4", "People say that the mayor is planning to resign.", "SAID", "The mayor ____ planning to resign.", ["is said to be"], "Subject + is said to be + -ing for the same time.", "is said to be planning."),
      p.tr("lesson-03-p5", "Somebody stole her bag while she was on the train.", "HAD", "She ____ stolen while she was on the train.", ["had her bag"], "Causative have + object + past participle, for events we experience.", "had her bag stolen."),
    ],
    vocabulary: [
      { term: "allegedly", meaning: "claimed to be true but not yet proved", example: "He allegedly forged the signature." },
      { term: "crackdown", meaning: "strict action against illegal or undesirable behaviour", example: "The government announced a crackdown on tax evasion." },
      { term: "spark controversy", meaning: "to cause public disagreement", example: "The ruling sparked controversy across the country." },
      { term: "come under fire", meaning: "to be strongly criticised", example: "The minister came under fire over the delay." },
      { term: "scrutinise", meaning: "to examine something very closely", example: "Journalists scrutinised the accounts." },
    ],
    test: [
      t.mcq("lesson-03-t1", "It is ____ that the economy will recover by spring.", ["widely expected", "widely expecting", "expected widely to", "widely expect"], 0, ["Expecting is active.", "It is expected to… would need a different structure.", "Expect is not a participle."], "It + is + adverb + past participle + that-clause.", "It is widely expected that…"),
      t.gap("lesson-03-t2", "The survivors are understood ____ been rescued by fishermen.", ["to have"], "To have + past participle for an earlier event.", "to have been rescued."),
      t.tr("lesson-03-t3", "They think that the thieves entered through the roof.", "THOUGHT", "The thieves ____ entered through the roof.", ["are thought to have"], "Subject + are thought to have + past participle.", "are thought to have entered."),
      t.mcq("lesson-03-t4", "Which sentence is correct?", ["She hates being told what to do.", "She hates to being told what to do.", "She hates be told what to do.", "She hates telling by others what to do."], 0, ["To being is not grammatical.", "Be told needs an infinitive marker or -ing.", "Telling by others is not a valid passive."], "Passive gerund: being + past participle.", "hates being told."),
      t.tr("lesson-03-t5", "Reports say that prices rose sharply last month.", "REPORTED", "Prices ____ sharply last month.", ["are reported to have risen"], "Subject + are reported to have + past participle.", "are reported to have risen."),
    ],
  };
})();

// ───────────────────────────── 4. Cleft sentences ─────────────────────────────
const L04: Lesson = (() => {
  const p = qb("grammar", "cleft-sentences", "C1", "culture");
  const t = qb("grammar", "cleft-sentences", "C1", "culture");
  return {
    id: "lesson-04",
    title: "Cleft sentences for emphasis",
    skill: "grammar",
    topic: "cleft-sentences",
    level: "C1",
    theme: "culture",
    minutes: 13,
    objective: "Use it-clefts and wh-clefts to place emphasis exactly where you want it.",
    explanation: [
      "A cleft sentence splits one clause in two to highlight a piece of information. The **it-cleft**: It was + focus + that / who + rest. It was **the soundtrack** that made the film memorable. It was **Elena who** designed the set. It was **in Seville that** I first heard flamenco.",
      "The **wh-cleft (pseudo-cleft)**: What + clause + is / was + focus. **What** I admire **is** her honesty. **What** happened **was that** the lights went out. With do: **What she did was** (to) leave. The reversed form is also common: Her honesty is what I admire.",
      "Other patterns: **All** I want is a quiet evening. **The reason why** it failed **is that** … **The place where** … Use clefts for contrast and correction: It wasn’t the price that worried me, but the delay.",
    ],
    explanationEs: "Español: “Fue Elena quien…” y “Lo que admiro es…”. En inglés necesitas siempre It + was … that/who. Error típico: “It was in 2019 when…” (debe ser that) y “All I did was to…” sin la forma correcta del verbo.",
    examples: [
      { sentence: "It was the director’s earlier film that made the critics take notice.", note: "Focus on the subject." },
      { sentence: "It wasn’t the plot that disappointed me; it was the acting.", note: "Contrast with a negative first." },
      { sentence: "What I found most moving was the final scene.", note: "Wh-cleft: what + clause + was." },
      { sentence: "What the novel lacks is a convincing narrator.", note: "Present: what + clause + is." },
      { sentence: "All he did was complain throughout the performance.", note: "All + clause + was + verb." },
      { sentence: "The reason why the festival was cancelled is that the funding fell through.", note: "The reason why … is that." },
    ],
    practice: [
      p.mcq("lesson-04-p1", "____ really annoyed me was the lack of subtitles.", ["What", "It", "That", "Which"], 0, ["It-cleft needs that/who at the end of the focus.", "That cannot begin a wh-cleft subject.", "Which does not act as a free relative here."], "What + clause + was introduces a wh-cleft.", "What + cláusula + was…"),
      p.gap("lesson-04-p2", "It was not until the 1950s ____ the museum opened to the public.", ["that"], "It was not until + time + that + clause.", "It was not until … that."),
      p.mcq("lesson-04-p3", "It was Elena ____ designed the stage set.", ["who", "which", "what", "whose"], 0, ["Which refers to things.", "What cannot complete an it-cleft here.", "Whose shows possession."], "People in it-clefts take who (or that).", "Personas: who o that."),
      p.tr("lesson-04-p4", "I enjoyed the live music most of all.", "WHAT", "What ____ most of all was the live music.", ["i enjoyed"], "What + subject + verb + was + focus.", "What I enjoyed … was…"),
      p.tr("lesson-04-p5", "The poor acting disappointed me.", "THAT", "It was the poor acting ____ me.", ["that disappointed"], "It was + focus + that + verb.", "It was … that disappointed me."),
    ],
    vocabulary: [
      { term: "acclaimed", meaning: "praised publicly by critics or the public", example: "She is an acclaimed documentary maker." },
      { term: "gripping", meaning: "so exciting that it holds your attention completely", example: "A gripping thriller from start to finish." },
      { term: "thought-provoking", meaning: "making people think seriously", example: "The exhibition is subtle and thought-provoking." },
      { term: "overrated", meaning: "considered better than it really is", example: "I found the novel hopelessly overrated." },
      { term: "stage presence", meaning: "the ability to hold the audience’s attention on stage", example: "He has remarkable stage presence." },
    ],
    test: [
      t.mcq("lesson-04-t1", "The reason why the festival was cancelled ____ the funding fell through.", ["is that", "is because", "was because that", "was why"], 0, ["The reason is because is a common error; use that.", "Because that is not standard.", "Was why repeats the idea of reason."], "The reason (why) … is that + clause.", "The reason is that… (no because)."),
      t.gap("lesson-04-t2", "What the novel lacks ____ a convincing narrator.", ["is"], "What + clause + is + noun phrase.", "What the novel lacks is…"),
      t.tr("lesson-04-t3", "She impressed the judges mostly with her originality.", "WHAT", "What ____ the judges most was her originality.", ["impressed"], "What + verb + object + was + focus.", "What impressed the judges most…"),
      t.mcq("lesson-04-t4", "Which sentence is correct?", ["It was in Seville that I first heard flamenco live.", "It was in Seville when I first heard flamenco live.", "That was in Seville that I first heard flamenco.", "It was Seville where I first heard flamenco live."], 0, ["When does not link an it-cleft.", "That was begins a different structure.", "Where requires the place to be introduced differently."], "It was + place / time + that + clause.", "It was in … that."),
      t.tr("lesson-04-t5", "He did nothing but complain throughout the film.", "ALL", "All ____ complain throughout the film.", ["he did was", "he did was to"], "All + subject + did + was (to) + verb.", "All he did was complain."),
    ],
  };
})();

// ───────────────────────────── 5. Dependent prepositions ─────────────────────────────
const L05: Lesson = (() => {
  const p = qb("useOfEnglish", "prepositions", "B2+", "academic");
  const t = qb("useOfEnglish", "prepositions", "C1", "academic");
  return {
    id: "lesson-05",
    title: "Dependent prepositions Spanish speakers get wrong",
    skill: "useOfEnglish",
    topic: "prepositions",
    level: "B2+",
    theme: "academic",
    minutes: 14,
    objective: "Use the correct preposition after common verbs, adjectives and nouns instead of translating from Spanish.",
    explanation: [
      "Many words take a fixed preposition, and Spanish rarely matches. **depend on** (not of), **consist of** (consistir en), **insist on** (insistir en), **married to** (casado con), **interested in**, **dream of / about** (soñar con), **rely on, succeed in, benefit from, suffer from, result in / result from, approve of, object to, comment on, apologise for / to, congratulate someone on, accuse someone of, blame someone for**.",
      "After a preposition, a verb takes the **-ing form**: succeed **in finding**, insist **on paying**, look forward **to seeing**, object **to being**. Careful: to is a preposition in look forward to / object to / be used to.",
      "In Use of English, check which preposition the word needs and whether an -ing form follows. Learn the whole chunk, not the word alone.",
    ],
    explanationEs: "No traduzcas la preposición: depender DE = depend ON; consistir EN = consist OF; insistir EN = insist ON; casado CON = married TO; soñar CON = dream OF/ABOUT. Tras la preposición, el verbo va en -ing.",
    examples: [
      { sentence: "The outcome depends on the sample size.", note: "Depend on, never of." },
      { sentence: "The course consists of six modules and a research project.", note: "Consist of; consist in is rare." },
      { sentence: "She insisted on seeing the original data.", note: "Insist on + -ing." },
      { sentence: "He has been married to a physicist for ten years.", note: "Married to, not with." },
      { sentence: "The study resulted in a major discovery.", note: "Result in = cause; result from = be caused by." },
      { sentence: "They congratulated her on winning the grant.", note: "Congratulate someone on + -ing." },
    ],
    practice: [
      p.mcq("lesson-05-p1", "The success of the project depends ____ the funding.", ["on", "of", "from", "in"], 0, ["Depend of is a Spanish calque.", "Depend from is not used.", "Depend in is not used."], "Depend on is the fixed pattern.", "depender de = depend on."),
      p.gap("lesson-05-p2", "The course consists ____ twelve modules and a final exam.", ["of"], "Consist of lists components.", "consistir en = consist of."),
      p.mcq("lesson-05-p3", "She finally succeeded ____ persuading the board.", ["in", "at", "on", "to"], 0, ["Succeed at is not used for this meaning.", "Succeed on is not used.", "Succeed to means inherit a title."], "Succeed in + -ing.", "succeed in + -ing."),
      p.tr("lesson-05-p4", "They congratulated her because she had won the prize.", "ON", "They congratulated her ____ the prize.", ["on winning"], "Congratulate someone on + -ing.", "congratulate on winning."),
      p.tr("lesson-05-p5", "Our success was due to hard work.", "RESULT", "Our success was the ____ hard work.", ["result of"], "The result of + noun.", "the result of."),
    ],
    vocabulary: [
      { term: "peer review", meaning: "evaluation of research by other experts before publication", example: "The article went through rigorous peer review." },
      { term: "undertake research", meaning: "to carry out a study", example: "She undertook research into memory loss." },
      { term: "substantiate", meaning: "to provide evidence that a claim is true", example: "The data substantiate the hypothesis." },
      { term: "hypothesis", meaning: "a proposed explanation to be tested", example: "The experiment supported our hypothesis." },
      { term: "draw a conclusion", meaning: "to reach a judgement from evidence", example: "It is too early to draw conclusions." },
    ],
    test: [
      t.mcq("lesson-05-t1", "The new policy will result ____ a significant reduction in costs.", ["in", "of", "from", "to"], 0, ["Result of follows the cause as a noun.", "Result from introduces the cause, not the effect.", "Result to is not used."], "Result in introduces the effect.", "result in = tener como resultado."),
      t.gap("lesson-05-t2", "She is totally dependent ____ her parents for money.", ["on"], "Dependent on, like depend on.", "dependent on."),
      t.mcq("lesson-05-t3", "He was accused ____ falsifying data.", ["of", "for", "with", "about"], 0, ["Accuse for is a calque.", "Accuse with is not used.", "Accuse about is not used."], "Accuse someone of + -ing.", "accuse of."),
      t.tr("lesson-05-t4", "I am against the new regulations.", "OBJECT", "I ____ the new regulations.", ["object to"], "Object to + noun / -ing.", "object to."),
      t.tr("lesson-05-t5", "The tutor said my presentation was excellent.", "COMPLIMENTED", "The tutor ____ my presentation.", ["complimented me on"], "Compliment someone on something.", "compliment on."),
    ],
  };
})();

// ───────────────────────────── 6. Collocations ─────────────────────────────
const L06: Lesson = (() => {
  const p = qb("vocabulary", "collocations", "B2+", "society");
  const t = qb("vocabulary", "collocations", "C1", "society");
  return {
    id: "lesson-06",
    title: "Strong collocations: make, do, take, pay, raise",
    skill: "vocabulary",
    topic: "collocations",
    level: "B2+",
    theme: "society",
    minutes: 13,
    objective: "Use accurate verb-noun collocations so your English sounds natural rather than translated.",
    explanation: [
      "Collocations are words that naturally go together. A wrong verb is rarely a grammar error; it simply sounds foreign. Spanish “hacer” is the biggest trap: it is **make** or **do** depending on the noun.",
      "**make**: a decision, a mistake, progress, an effort, an impression, a point, a profit. **do**: research, damage, harm, business, a favour, your best, the shopping. **take**: place, responsibility, advantage of, into account, a risk, a stand, action. **pay**: attention, a visit, respect, a compliment, tribute. **raise**: awareness, concerns, funds, a question, standards. Also: **reach** a consensus, **bear** in mind, **lodge** a complaint, **run** a risk.",
      "Learn collocations as whole chunks, in context, and notice them when you read.",
    ],
    explanationEs: "“Hacer” no siempre es make o do: hacer una pregunta = ask a question; tomar una decisión = make a decision; prestar atención = pay attention; hacer daño = do harm.",
    examples: [
      { sentence: "The charity aims to raise awareness of homelessness.", note: "Raise awareness, not rise." },
      { sentence: "Excessive screen time can do real harm to young children.", note: "Do harm / do damage." },
      { sentence: "Councils must take responsibility for local services.", note: "Take responsibility." },
      { sentence: "The residents paid tribute to the volunteers.", note: "Pay tribute." },
      { sentence: "Please bear in mind that funding is limited.", note: "Bear in mind." },
    ],
    practice: [
      p.mcq("lesson-06-p1", "The charity aims to ____ awareness of homelessness.", ["raise", "rise", "make", "lift"], 0, ["Rise is intransitive.", "Make awareness is not a collocation.", "Lift is physical."], "Raise awareness is the fixed collocation.", "raise awareness."),
      p.gap("lesson-06-p2", "It’s about time we ____ a stand against online abuse.", ["took"], "Take a stand; the structure it’s about time + past simple.", "take a stand."),
      p.mcq("lesson-06-p3", "The new law has ____ little to reduce inequality.", ["done", "made", "taken", "paid"], 0, ["Make little is possible only with difference.", "Take little does not fit.", "Pay little is about money."], "Do little to + verb is common.", "do little to."),
      p.tr("lesson-06-p4", "Please listen carefully to the instructions.", "ATTENTION", "Please ____ to the instructions.", ["pay attention", "pay close attention"], "Pay attention.", "pay attention."),
      p.tr("lesson-06-p5", "The committee finally agreed on a plan.", "CONSENSUS", "The committee finally ____ on a plan.", ["reached a consensus", "reached consensus"], "Reach a consensus.", "reach a consensus."),
    ],
    vocabulary: [
      { term: "grassroots", meaning: "involving ordinary people rather than leaders", example: "The campaign began as a grassroots movement." },
      { term: "marginalised", meaning: "treated as unimportant or pushed to the edge of society", example: "Marginalised communities lack political voice." },
      { term: "social cohesion", meaning: "the bonds that hold a society together", example: "Housing policy affects social cohesion." },
      { term: "foster", meaning: "to encourage the development of", example: "Schools should foster tolerance." },
      { term: "tackle", meaning: "to deal with a difficult problem", example: "The government pledged to tackle poverty." },
    ],
    test: [
      t.mcq("lesson-06-t1", "The council has been urged to ____ immediate action on air pollution.", ["take", "make", "do", "give"], 0, ["Make action is not a collocation.", "Do action is not a collocation.", "Give action is not a collocation."], "Take action.", "take action."),
      t.gap("lesson-06-t2", "Several residents have ____ a formal complaint about the noise.", ["lodged", "filed", "made"], "Lodge / file / make a complaint.", "lodge a complaint."),
      t.tr("lesson-06-t3", "Remember that the project has a very tight deadline.", "MIND", "Bear ____ that the project has a very tight deadline.", ["in mind"], "Bear in mind.", "bear in mind."),
      t.mcq("lesson-06-t4", "Which sentence sounds most natural?", ["She made a significant contribution to the debate.", "She did a significant contribution to the debate.", "She took a significant contribution to the debate.", "She paid a significant contribution to the debate."], 0, ["Do a contribution is not used.", "Take a contribution is not used.", "Pay a contribution implies money."], "Make a contribution.", "make a contribution."),
      t.tr("lesson-06-t5", "The volunteers managed to collect €5,000 for the shelter.", "RAISED", "The volunteers managed ____ €5,000 for the shelter.", ["to raise"], "Manage to + raise money.", "manage to raise."),
    ],
  };
})();

// ───────────────────────────── 7. Phrasal verbs: business ─────────────────────────────
const L07: Lesson = (() => {
  const p = qb("vocabulary", "phrasal-verbs", "C1", "business");
  const t = qb("vocabulary", "phrasal-verbs", "C1", "business");
  return {
    id: "lesson-07",
    title: "Phrasal verbs for work and business",
    skill: "vocabulary",
    topic: "phrasal-verbs",
    level: "C1",
    theme: "business",
    minutes: 15,
    objective: "Use precise phrasal verbs to talk about launching, growing, cutting and closing deals at work.",
    explanation: [
      "Business English is full of phrasal verbs. **set up** (a company), **take over** (acquire), **step down** (resign), **scale back / cut back on** (reduce), **roll out** (launch gradually), **iron out** (resolve small problems), **follow up on**, **turn down** (reject), **break even** (neither profit nor loss), **bring forward** (earlier), **phase out**, **draw up** (a contract), **sign off on** (approve), **look into** (investigate), **carry out**, **bail out**.",
      "Separable or not? **Separable**: draw up a contract / draw it up (a pronoun always goes in the middle). **Inseparable**: look into the issue / look into it. Check a dictionary and learn each verb with its pattern.",
      "Phrasal verbs are mostly neutral. In very formal writing, prefer one-word equivalents (resign, decline, investigate), but in meetings and emails phrasal verbs sound natural.",
    ],
    explanationEs: "Error frecuente: poner el pronombre mal (“turn down it”). Con verbos separables el pronombre va en medio: turn it down. Además, no los traduzcas literalmente: take over ≠ “tomar sobre”.",
    examples: [
      { sentence: "The founder will step down as CEO next month after twelve years.", note: "Step down = resign from a position." },
      { sentence: "We aim to roll out the new software across all branches in March.", note: "Roll out = introduce gradually." },
      { sentence: "The legal team drew up the contract overnight.", note: "Separable: drew it up." },
      { sentence: "After two years of losses, the start-up finally broke even.", note: "Break even." },
      { sentence: "Management plans to phase out the old model by 2027.", note: "Phase out = stop gradually." },
    ],
    practice: [
      p.mcq("lesson-07-p1", "The founder will ____ as CEO next month after twelve years.", ["step down", "step in", "step up", "step out"], 0, ["Step in means intervene.", "Step up means increase or take responsibility.", "Step out means leave temporarily."], "Step down = resign.", "step down = dimitir."),
      p.gap("lesson-07-p2", "We need to ____ out a few problems before the launch.", ["iron"], "Iron out = resolve small difficulties.", "iron out."),
      p.mcq("lesson-07-p3", "The firm plans to ____ the new software across all branches in March.", ["roll out", "roll over", "roll up", "roll in"], 0, ["Roll over means continue or renew.", "Roll up means arrive or fold.", "Roll in means arrive in large numbers."], "Roll out = introduce gradually.", "roll out."),
      p.tr("lesson-07-p4", "The company has decided to reject the takeover offer.", "TURNED", "The company has ____ the takeover offer.", ["turned down"], "Turn down = reject.", "turn down."),
      p.tr("lesson-07-p5", "The lawyers prepared the contract yesterday.", "DREW", "The lawyers ____ the contract yesterday.", ["drew up"], "Draw up = prepare a formal document.", "draw up."),
    ],
    vocabulary: [
      { term: "leverage", meaning: "to use something to maximum advantage", example: "We can leverage our existing network." },
      { term: "bottom line", meaning: "the final profit or loss; the key point", example: "The bottom line is that costs must fall." },
      { term: "stakeholder", meaning: "someone with an interest in a business", example: "We consulted all stakeholders." },
      { term: "streamline", meaning: "to make more efficient by simplifying", example: "The merger will streamline operations." },
      { term: "downsize", meaning: "to reduce the number of employees", example: "The firm downsized after the crisis." },
    ],
    test: [
      t.mcq("lesson-07-t1", "Sales were so poor that the company had to ____ production.", ["scale back", "scale up", "scale over", "scale off"], 0, ["Scale up means increase.", "Scale over is not a phrasal verb.", "Scale off is not a phrasal verb."], "Scale back = reduce.", "scale back = reducir."),
      t.gap("lesson-07-t2", "After three years of losses, the start-up finally ____ even last quarter.", ["broke"], "Break even in the past: broke even.", "broke even."),
      t.tr("lesson-07-t3", "Our rival has acquired a small software firm.", "TAKEN", "Our rival has ____ a small software firm.", ["taken over"], "Take over = acquire.", "take over."),
      t.mcq("lesson-07-t4", "Which sentence is correct?", ["The directors drew it up last week.", "The directors drew up it last week.", "The directors drew up to it last week.", "The directors it drew up last week."], 0, ["A pronoun cannot follow the particle of a separable verb.", "Up to it changes the meaning.", "The pronoun cannot precede the verb."], "Separable verbs take the pronoun in the middle.", "draw it up."),
      t.tr("lesson-07-t5", "We’ll investigate the complaint.", "LOOK", "We’ll ____ the complaint.", ["look into"], "Look into = investigate.", "look into."),
    ],
  };
})();

// ───────────────────────────── 8. Word formation ─────────────────────────────
const L08: Lesson = (() => {
  const p = qb("useOfEnglish", "word-formation", "B2+", "education");
  const t = qb("useOfEnglish", "word-formation", "C1", "education");
  return {
    id: "lesson-08",
    title: "Word formation: negative prefixes and noun suffixes",
    skill: "useOfEnglish",
    topic: "word-formation",
    level: "B2+",
    theme: "education",
    minutes: 14,
    objective: "Form negative adjectives and abstract nouns accurately for Use of English Part 3.",
    explanation: [
      "**Negative prefixes**: **un-** (unreliable), **in-** (inaccurate, inefficient), **im-** before b, m, p (impossible, immature), **il-** before l (illegal), **ir-** before r (irrelevant), **dis-** (dishonest, disagree), **mis-** (misunderstand), **non-** (non-existent).",
      "**Noun suffixes**: **-ness** (awareness), **-ity** (ability, flexibility), **-ment** (achievement), **-tion / -sion** (education, decision), **-ance / -ence** (performance, confidence), **-ship** (relationship), **-ism / -ist**.",
      "Check four things: part of speech needed, whether the meaning is negative, whether the noun should be plural, and spelling changes (happy → happiness, decide → decision).",
    ],
    explanationEs: "Cuidado con el prefijo: la mayoría de los errores vienen de escribir “inpossible” en lugar de impossible (im- antes de p, b, m) o “unlegal” en lugar de illegal.",
    examples: [
      { sentence: "The lecture was irrelevant to the exam syllabus.", note: "ir- before r." },
      { sentence: "Her ability to learn languages impressed the examiners.", note: "able → ability." },
      { sentence: "The school has a zero-tolerance policy on cheating.", note: "tolerate → tolerance." },
      { sentence: "It is illegal to copy the exam paper.", note: "il- before l." },
      { sentence: "The students misunderstood the question.", note: "mis- for wrong action." },
    ],
    practice: [
      p.gap("lesson-08-p1", "Students found the lecture ____ and unhelpful.", ["irrelevant"], "Relevant takes the prefix ir-.", "irrelevant.", "RELEVANT"),
      p.gap("lesson-08-p2", "Her ____ to learn languages impressed the examiners.", ["ability"], "Able becomes ability.", "ability.", "ABLE"),
      p.mcq("lesson-08-p3", "It is ____ to complete the course in under a month.", ["impossible", "inpossible", "unpossible", "dispossible"], 0, ["Im- is required before p.", "Un- is not used with possible.", "Dis- is not used with possible."], "Im- before p.", "impossible."),
      p.gap("lesson-08-p4", "The school has a policy of zero ____ of bullying.", ["tolerance"], "Tolerate becomes tolerance.", "tolerance.", "TOLERATE"),
      p.tr("lesson-08-p5", "She didn’t understand the instructions correctly.", "MISUNDERSTOOD", "She ____ the instructions.", ["misunderstood"], "Mis- + understood.", "misunderstood."),
    ],
    vocabulary: [
      { term: "curriculum", meaning: "the subjects taught in a school or course", example: "The curriculum includes coding." },
      { term: "tuition", meaning: "teaching, or the fee paid for it", example: "Tuition fees have risen sharply." },
      { term: "assessment", meaning: "evaluation of students’ work", example: "Continuous assessment replaced the final exam." },
      { term: "coursework", meaning: "work done during a course and counted towards the grade", example: "Coursework accounts for 40% of the mark." },
      { term: "plagiarism", meaning: "copying someone’s work and presenting it as your own", example: "Plagiarism is a serious offence." },
    ],
    test: [
      t.gap("lesson-08-t1", "The committee was criticised for its ____ to act.", ["unwillingness"], "Willing → unwilling → unwillingness.", "unwillingness.", "WILLING"),
      t.gap("lesson-08-t2", "Her ____ with the project made it a success.", ["involvement"], "Involve → involvement.", "involvement.", "INVOLVE"),
      t.mcq("lesson-08-t3", "The report contained several ____ statistics.", ["inaccurate", "unaccurate", "disaccurate", "misaccurate"], 0, ["Un- is not used with accurate.", "Dis- is not used with accurate.", "Mis- is not used with accurate."], "In- + accurate.", "inaccurate."),
      t.gap("lesson-08-t4", "Downloading films without paying is ____.", ["illegal"], "Legal → illegal.", "illegal.", "LEGAL"),
      t.tr("lesson-08-t5", "No one can predict how long the course will take.", "UNPREDICTABLE", "The length of the course is ____.", ["unpredictable"], "Predictable → unpredictable.", "unpredictable."),
    ],
  };
})();

// ───────────────────────────── 9. Linking & contrast ─────────────────────────────
const L09: Lesson = (() => {
  const p = qb("writing", "linking", "C1", "environment");
  const t = qb("writing", "linking", "C1", "environment");
  return {
    id: "lesson-09",
    title: "Linking and contrast: albeit, whereas, nonetheless, notwithstanding",
    skill: "writing",
    topic: "linking",
    level: "C1",
    theme: "environment",
    minutes: 14,
    objective: "Use a range of contrast and concession linkers to build precise, well-organised arguments.",
    explanation: [
      "**albeit** (= although it is) adds a reluctant concession and is followed by an adjective, adverb or phrase: a modest, **albeit** significant, step. **whereas / while** contrast two facts in one sentence: Solar power is cheap to run, **whereas** nuclear plants need huge investment.",
      "**nonetheless / nevertheless** are sentence adverbs: The results were mixed. **Nonetheless**, the trial will continue. **notwithstanding** + noun = despite: **Notwithstanding** the cost, the project went ahead. Also: **despite / in spite of + noun or -ing**; **although / even though + clause**; **that said, be that as it may**.",
      "Avoid despite of, despite that, and but however. Say despite the fact that … or although …, and use only one linker per idea.",
    ],
    explanationEs: "No digas “despite of” ni “but however”. “A pesar de que” = although / despite the fact that; “a pesar de” = despite / in spite of + nombre o -ing; “sin embargo” = however / nevertheless.",
    examples: [
      { sentence: "The measures were effective, albeit slowly.", note: "Albeit + adverb." },
      { sentence: "Wind farms are cheap to run, whereas nuclear plants require huge investment.", note: "Contrast between two subjects." },
      { sentence: "The results were disappointing; nonetheless, the team remained optimistic.", note: "Nonetheless after a semicolon." },
      { sentence: "Notwithstanding strong opposition, the dam was built.", note: "Notwithstanding + noun." },
      { sentence: "In spite of being expensive, the scheme won public support.", note: "In spite of + -ing." },
    ],
    practice: [
      p.mcq("lesson-09-p1", "The measures were effective, ____ slowly.", ["albeit", "despite", "whereas", "owing to"], 0, ["Despite cannot be followed by an adverb here.", "Whereas needs a clause.", "Owing to needs a noun."], "Albeit introduces a reluctant concession.", "albeit = aunque."),
      p.gap("lesson-09-p2", "____ the heavy rain, the protest went ahead.", ["notwithstanding", "despite", "in spite of"], "Notwithstanding, despite and in spite of take a noun.", "despite + sustantivo."),
      p.mcq("lesson-09-p3", "Wind farms are cheap to run, ____ nuclear plants require huge investment.", ["whereas", "despite", "nonetheless", "albeit"], 0, ["Despite needs a noun.", "Nonetheless needs a separate sentence.", "Albeit does not link two full clauses."], "Whereas contrasts two clauses.", "whereas = mientras que."),
      p.tr("lesson-09-p4", "Although the plan was expensive, it won public support.", "SPITE", "The plan won public support ____ expensive.", ["in spite of being", "in spite of its being"], "In spite of + -ing.", "in spite of being."),
      p.tr("lesson-09-p5", "The scheme has flaws, but it is a step forward.", "ALBEIT", "The scheme is a step forward, ____ flawed.", ["albeit"], "Albeit + adjective.", "albeit flawed."),
    ],
    vocabulary: [
      { term: "carbon footprint", meaning: "the amount of CO2 released by a person or activity", example: "Flying increases your carbon footprint." },
      { term: "biodiversity", meaning: "the variety of plant and animal life", example: "Logging threatens biodiversity." },
      { term: "mitigate", meaning: "to make less severe", example: "Planting trees mitigates flooding." },
      { term: "unsustainable", meaning: "unable to be maintained over time", example: "Current fishing levels are unsustainable." },
      { term: "renewable", meaning: "naturally replaced; not used up", example: "Renewable energy is now cheaper." },
    ],
    test: [
      t.mcq("lesson-09-t1", "____ the opposition of local residents, the airport expansion was approved.", ["Notwithstanding", "Albeit", "Whereas", "Nonetheless"], 0, ["Albeit cannot introduce a noun.", "Whereas needs a clause.", "Nonetheless is a sentence adverb."], "Notwithstanding + noun.", "notwithstanding + nombre."),
      t.gap("lesson-09-t2", "The policy is popular with voters; ____, economists have serious doubts about it.", ["nevertheless", "nonetheless", "however"], "Contrast linker after a semicolon.", "nevertheless."),
      t.tr("lesson-09-t3", "Despite having little funding, the campaign succeeded.", "ALTHOUGH", "The campaign succeeded ____ little funding.", ["although it had", "even though it had", "though it had"], "Although + clause.", "although it had."),
      t.mcq("lesson-09-t4", "Which sentence is correct?", ["Despite the fact that prices rose, demand remained strong.", "Despite of prices rose, demand remained strong.", "Despite that prices rose, demand remained strong.", "In spite prices rose, demand remained strong."], 0, ["Despite of is wrong.", "Despite that is wrong.", "In spite needs of."], "Despite the fact that + clause.", "despite the fact that."),
      t.tr("lesson-09-t5", "Some people value convenience, while others prefer sustainability.", "WHEREAS", "Some people value convenience, ____ prefer sustainability.", ["whereas others"], "Whereas + subject.", "whereas others."),
    ],
  };
})();

// ───────────────────────────── 10. Register ─────────────────────────────
const L10: Lesson = (() => {
  const p = qb("writing", "register", "C1", "work");
  const t = qb("writing", "register", "C1", "work");
  return {
    id: "lesson-10",
    title: "Register: formal vs neutral for C1 writing",
    skill: "writing",
    topic: "register",
    level: "C1",
    theme: "work",
    minutes: 14,
    objective: "Choose formal or neutral vocabulary and structures that match the situation in a report or letter.",
    explanation: [
      "C1 writing is judged on appropriateness. Formal register: no contractions, precise verbs, impersonal structures. Neutral register (articles, many emails, reviews) allows moderate phrasal verbs and a natural tone.",
      "Typical upgrades: **get → obtain / receive**, **need → require**, **ask for → request**, **look into → investigate**, **show → demonstrate**, **a lot of → numerous / a great deal of**, **but → however / yet**, **so → therefore / consequently**, **think → consider / believe**. Use impersonal frames: **It is widely acknowledged that…**, **It would appear that…**.",
      "Do not inflate every word. Overformal writing sounds pompous. Be consistent and keep one voice. Avoid exclamation marks and idioms in formal pieces.",
    ],
    explanationEs: "Ojo con los falsos amigos: actually = en realidad (no “actualmente”, que es currently); eventually = finalmente (no “eventualmente”). Formal no es lo mismo que “largo”.",
    examples: [
      { sentence: "I am writing to enquire about the recent changes to the timetable.", note: "Formal opening." },
      { sentence: "Candidates are required to submit their forms by 5 pm.", note: "Passive + required." },
      { sentence: "It would appear that the new system has reduced waiting times.", note: "Hedged and impersonal." },
      { sentence: "We apologise for the late arrival of the shipment.", note: "Neutral-formal apology." },
      { sentence: "A large number of delegates attended the conference.", note: "Instead of a lot of people." },
    ],
    practice: [
      p.mcq("lesson-10-p1", "I am writing to ____ about the recent changes to the timetable.", ["enquire", "find out", "ask around", "check up"], 0, ["Find out is neutral.", "Ask around is informal.", "Check up is informal."], "Enquire is formal.", "enquire = informarse."),
      p.gap("lesson-10-p2", "Candidates are ____ to submit their forms by 5 pm.", ["required", "requested", "expected"], "Required / requested are formal.", "required."),
      p.mcq("lesson-10-p3", "Which sentence is the most appropriate for a formal report?", ["It would appear that the new system has reduced waiting times.", "The new system has totally cut waiting times, which is great.", "We reckon the new system’s kind of worked.", "The new system’s cut waiting times big time."], 0, ["Too informal.", "Contractions and slang.", "Slang."], "Impersonal and hedged.", "registro formal."),
      p.tr("lesson-10-p4", "We are sorry that the shipment was late.", "APOLOGISE", "We ____ the late arrival of the shipment.", ["apologise for", "apologize for"], "Apologise for + noun.", "apologise for."),
      p.tr("lesson-10-p5", "A lot of people attended the conference.", "NUMBER", "A large ____ attended the conference.", ["number of people"], "A large number of + plural.", "a large number of."),
    ],
    vocabulary: [
      { term: "liaise with", meaning: "to communicate and cooperate with", example: "She liaises with suppliers daily." },
      { term: "undertake", meaning: "to commit to doing something", example: "We undertake to reply within 48 hours." },
      { term: "with regard to", meaning: "concerning", example: "With regard to your complaint, we are investigating." },
      { term: "at your earliest convenience", meaning: "as soon as you can", example: "Please reply at your earliest convenience." },
      { term: "ensure", meaning: "to make certain", example: "We ensure data is protected." },
    ],
    test: [
      t.mcq("lesson-10-t1", "The company will ____ the matter thoroughly.", ["investigate", "poke into", "look at", "check out"], 0, ["Too informal.", "Neutral.", "Informal."], "Investigate is formal.", "investigate."),
      t.gap("lesson-10-t2", "Please find ____ the document you requested.", ["enclosed", "attached"], "Formal correspondence phrase.", "enclosed."),
      t.tr("lesson-10-t3", "We need to get your approval before we go ahead.", "OBTAIN", "It is necessary ____ your approval before we proceed.", ["to obtain"], "Necessary to + obtain.", "to obtain."),
      t.mcq("lesson-10-t4", "Prices have risen; ____, wages have remained flat.", ["nevertheless", "but", "though", "still and all"], 0, ["But after a semicolon is weak.", "Though is informal here.", "Idiomatic and informal."], "Nevertheless is formal.", "nevertheless."),
      t.tr("lesson-10-t5", "At the moment, we are reviewing the policy.", "CURRENTLY", "We ____ reviewing the policy.", ["are currently"], "Currently = at the moment.", "currently, no actually."),
    ],
  };
})();

// ───────────────────────────── 11. Modals of deduction in the past ─────────────────────────────
const L11: Lesson = (() => {
  const p = qb("grammar", "modals", "B2+", "relationships");
  const t = qb("grammar", "modals", "C1", "relationships");
  return {
    id: "lesson-11",
    title: "Modals of deduction in the past",
    skill: "grammar",
    topic: "modals",
    level: "B2+",
    theme: "relationships",
    minutes: 13,
    objective: "Use must / can’t / might + have + past participle to speculate about past events.",
    explanation: [
      "**must have + past participle** = almost certain it happened. **can’t / couldn’t have + past participle** = almost certain it did not. **may / might / could have + past participle** = possible. **may / might not have** = possible negative.",
      "For ongoing actions use **have been + -ing**: They must have been waiting. Compare: **should / ought to have** = criticism or regret, and **needn’t have** = did it, but it was unnecessary.",
      "Never use mustn’t have for deduction: use can’t have.",
    ],
    explanationEs: "“Debe de haber” = must have. “No puede haber” = can’t have, nunca “mustn’t have”. Might no es tan seguro como must.",
    examples: [
      { sentence: "He was still wearing his ring, so he can’t have been divorced.", note: "Negative certainty." },
      { sentence: "You must have been exhausted after the flight.", note: "Strong deduction." },
      { sentence: "She might have misunderstood the instructions.", note: "Possibility." },
      { sentence: "You should have told me you were upset.", note: "Criticism." },
      { sentence: "We needn’t have rushed; the train was late.", note: "Unnecessary action." },
    ],
    practice: [
      p.mcq("lesson-11-p1", "He was still wearing his wedding ring, so he ____ divorced.", ["can’t have been", "mustn’t have been", "shouldn’t have been", "mightn’t be"], 0, ["Mustn’t does not express deduction.", "Shouldn’t is criticism.", "Mightn’t be refers to present."], "Can’t have been = certain not.", "can’t have been."),
      p.gap("lesson-11-p2", "Anna was with me all evening, so she ____ have sent that message.", ["can't", "couldn't", "cannot"], "Can’t have + participle.", "can’t have."),
      p.mcq("lesson-11-p3", "You ____ told me you were upset; I would have listened.", ["should have", "must have", "might have been", "can have"], 0, ["Must have is deduction.", "Might have been doesn’t fit.", "Can have is not used."], "Should have = criticism.", "should have."),
      p.tr("lesson-11-p4", "I’m sure Jorge forgot our anniversary.", "MUST", "Jorge ____ our anniversary.", ["must have forgotten"], "Must have + participle.", "must have forgotten."),
      p.tr("lesson-11-p5", "It’s possible that she misunderstood what I said.", "MIGHT", "She ____ what I said.", ["might have misunderstood"], "Might have + participle.", "might have misunderstood."),
    ],
    vocabulary: [
      { term: "rift", meaning: "a serious disagreement", example: "A rift grew between the sisters." },
      { term: "reconcile", meaning: "to restore friendly relations", example: "They finally reconciled." },
      { term: "estranged", meaning: "no longer in contact with", example: "She is estranged from her father." },
      { term: "bond", meaning: "a close connection", example: "They share a strong bond." },
      { term: "fall out", meaning: "to quarrel and stop being friends", example: "They fell out over money." },
    ],
    test: [
      t.mcq("lesson-11-t1", "When I called, nobody answered. They ____ asleep.", ["must have been", "must be", "can have been", "should have been"], 0, ["Must be is present.", "Can have is not used.", "Should is criticism."], "Must have been.", "must have been."),
      t.gap("lesson-11-t2", "You needn’t ____ bought flowers; she is allergic to them anyway.", ["have"], "Needn’t have + participle.", "needn’t have."),
      t.tr("lesson-11-t3", "Perhaps he didn’t get my text.", "MAY", "He ____ got my text.", ["may not have"], "May not have + participle.", "may not have."),
      t.mcq("lesson-11-t4", "Which sentence expresses criticism?", ["You should have called her before she heard it from someone else.", "You must have called her before she heard it from someone else.", "You might call her before she hears it.", "You can have called her."], 0, ["Must have is deduction.", "Might call is a suggestion.", "Can have is incorrect."], "Should have = criticism.", "should have."),
      t.tr("lesson-11-t5", "I regret not saying goodbye to her.", "SHOULD", "I ____ goodbye to her.", ["should have said"], "Should have said.", "should have said."),
    ],
  };
})();

// ───────────────────────────── 12. Reported speech ─────────────────────────────
const L12: Lesson = (() => {
  const p = qb("grammar", "reported-speech", "C1", "current-affairs");
  const t = qb("grammar", "reported-speech", "C1", "current-affairs");
  return {
    id: "lesson-12",
    title: "Reported speech with reporting verbs",
    skill: "grammar",
    topic: "reported-speech",
    level: "C1",
    theme: "current-affairs",
    minutes: 14,
    objective: "Use a range of reporting verbs with the correct patterns to report speech concisely.",
    explanation: [
      "Beyond say and tell, reporting verbs carry meaning and a fixed pattern. **verb + that**: admit, claim, point out, insist, warn, suggest. **verb + object + to-infinitive**: advise, warn, urge, persuade, remind, order. **verb + to-infinitive**: promise, offer, refuse, threaten, agree. **verb + -ing**: admit, deny, suggest, recommend. **verb + prep + -ing**: apologise for, insist on, accuse someone of, blame someone for.",
      "Tell needs a person (told us), say does not (said to us). Reported questions use normal word order, no do-support: She asked whether I had finished.",
      "Reporting verbs show attitude: claimed suggests doubt; pointed out suggests fact.",
    ],
    explanationEs: "Errores típicos: “He said me”, “suggested me to go”, “explain me”. Usa told me / suggested that I go / explained to me.",
    examples: [
      { sentence: "The minister denied taking money from lobbyists.", note: "Deny + -ing." },
      { sentence: "Her lawyer advised her not to speak to the press.", note: "Advise + object + to." },
      { sentence: "Tom promised to pay me back on Friday.", note: "Promise + to." },
      { sentence: "She accused him of stealing her idea.", note: "Accuse of + -ing." },
      { sentence: "The CEO warned that the firm would not survive without cuts.", note: "Warn that." },
    ],
    practice: [
      p.mcq("lesson-12-p1", "The minister ____ taking money from the lobbyists.", ["denied", "refused", "promised", "threatened"], 0, ["Refused + to.", "Promised + to.", "Threatened + to."], "Deny + -ing.", "deny + -ing."),
      p.gap("lesson-12-p2", "Her lawyer advised her not ____ to the press.", ["to speak", "to talk"], "Advise + object + not to + verb.", "not to speak."),
      p.mcq("lesson-12-p3", "He ____ us that the figures were wrong.", ["told", "said", "explained", "suggested"], 0, ["Said needs to us.", "Explained needs to us.", "Suggested us is wrong."], "Tell + person.", "told us."),
      p.tr("lesson-12-p4", "'I’ll definitely pay you back on Friday,' said Tom.", "PROMISED", "Tom ____ me back on Friday.", ["promised to pay"], "Promise + to + verb.", "promised to pay."),
      p.tr("lesson-12-p5", "'You took my idea,' she said to him.", "ACCUSED", "She ____ her idea.", ["accused him of taking", "accused him of stealing"], "Accuse someone of + -ing.", "accused him of."),
    ],
    vocabulary: [
      { term: "allege", meaning: "to claim without proof", example: "The report alleges fraud." },
      { term: "concede", meaning: "to admit reluctantly", example: "He conceded that he had been wrong." },
      { term: "reiterate", meaning: "to say again", example: "The minister reiterated his position." },
      { term: "dispute", meaning: "to question the truth of", example: "The company disputes the figures." },
      { term: "retract", meaning: "to withdraw a statement", example: "The paper retracted the story." },
    ],
    test: [
      t.mcq("lesson-12-t1", "The CEO ____ that the company would not survive without cuts.", ["warned", "urged", "recommended", "persuaded"], 0, ["Urged needs an object.", "Recommended does not fit.", "Persuaded needs an object."], "Warn that.", "warn that."),
      t.gap("lesson-12-t2", "Critics have blamed the government ____ failing to act sooner.", ["for"], "Blame someone for.", "blame for."),
      t.tr("lesson-12-t3", "'Why don’t we hold the meeting online?' said Marta.", "SUGGESTED", "Marta ____ the meeting online.", ["suggested holding", "suggested that we hold", "suggested that we held", "suggested we hold", "suggested we held"], "Suggest + -ing / that.", "suggest."),
      t.mcq("lesson-12-t4", "Which sentence is correct?", ["She asked me whether I had finished the report.", "She asked me had I finished the report.", "She asked me that I had finished the report.", "She asked to me whether I had finished."], 0, ["No inversion.", "That is wrong.", "To me is wrong."], "Whether + clause.", "whether."),
      t.tr("lesson-12-t5", "'Don’t touch the equipment,' the technician told us.", "WARNED", "The technician ____ the equipment.", ["warned us not to touch"], "Warn + object + not to.", "warned us not to touch."),
    ],
  };
})();

// ───────────────────────────── 13. Articles ─────────────────────────────
const L13: Lesson = (() => {
  const p = qb("grammar", "articles", "B2+", "travel");
  const t = qb("grammar", "articles", "C1", "travel");
  return {
    id: "lesson-13",
    title: "Articles: the hard cases for Spanish speakers",
    skill: "grammar",
    topic: "articles",
    level: "B2+",
    theme: "travel",
    minutes: 13,
    objective: "Use a, the or no article correctly in the contexts where Spanish and English differ.",
    explanation: [
      "**No article** for general plurals and uncountables (Tourists love beaches; Travel broadens the mind), abstract nouns, most countries and cities, languages, meals (have breakfast), institutions used for their purpose (go to school, in prison, in hospital), and by + transport (by train).",
      "**The** for specific or already mentioned things, unique things (the sun), superlatives, rivers, oceans, mountain ranges, plural countries (the Alps, the Atlantic, the Netherlands, the UK), and the + adjective (the elderly).",
      "**A / an** for first mention, jobs (She’s a pilot), frequency (twice a day), and with such / quite / what (such an experience, what a view).",
    ],
    explanationEs: "Trampa: el español usa artículo donde el inglés no. “La vida es corta” = Life is short; “Me gustan los museos” = I like museums; “el lunes” = on Monday; “Es piloto” = He’s a pilot.",
    examples: [
      { sentence: "Tourism is the main source of income on the island.", note: "General noun, no article." },
      { sentence: "We sailed across the Atlantic in a small boat.", note: "Ocean takes the." },
      { sentence: "She works as a tour guide in Peru.", note: "Job takes a." },
      { sentence: "The ferry leaves three times a day.", note: "a = per." },
      { sentence: "What a stunning view!", note: "What a + singular noun." },
      { sentence: "He was sentenced to ten years in prison.", note: "Institution zero article." },
    ],
    practice: [
      p.mcq("lesson-13-p1", "____ tourism is the main source of income on the island.", ["No article", "The", "A", "An"], 0, ["The is only for specific tourism.", "A cannot be used with uncountable nouns.", "An cannot be used with uncountable nouns."], "General uncountable noun, no article.", "tourism sin artículo."),
      p.gap("lesson-13-p2", "She works as ____ tour guide in Peru.", ["a"], "Job takes a.", "a tour guide."),
      p.mcq("lesson-13-p3", "We got to the hotel late and ____ receptionist had already left.", ["the", "a", "no article", "an"], 0, ["A would introduce someone unknown.", "No article is not possible with a singular count noun.", "An is used before vowels."], "The receptionist is understood from context.", "the receptionist."),
      p.tr("lesson-13-p4", "I have never had a better guide than Jorge.", "BEST", "Jorge is ____ guide I have ever had.", ["the best"], "Superlatives take the.", "the best."),
      p.tr("lesson-13-p5", "The ferry leaves three times each day.", "A", "The ferry leaves three times ____.", ["a day"], "A day means per day.", "a day."),
    ],
    vocabulary: [
      { term: "off the beaten track", meaning: "away from the usual tourist places", example: "We found a village off the beaten track." },
      { term: "itinerary", meaning: "a planned route or schedule", example: "Our itinerary includes three cities." },
      { term: "layover", meaning: "a short stop between flights", example: "We had a six-hour layover in Doha." },
      { term: "hospitality", meaning: "friendly treatment of guests", example: "The locals showed great hospitality." },
      { term: "bustling", meaning: "full of busy activity", example: "A bustling market." },
    ],
    test: [
      t.mcq("lesson-13-t1", "We usually have ____ breakfast at seven.", ["no article", "the", "a", "an"], 0, ["The is only for specific breakfast.", "A cannot be used here.", "An cannot be used here."], "Meals take no article.", "have breakfast."),
      t.gap("lesson-13-t2", "They sailed across ____ Atlantic in a small boat.", ["the"], "Oceans take the.", "the Atlantic."),
      t.mcq("lesson-13-t3", "He was sentenced to ten years in ____ prison.", ["no article", "the", "a", "an"], 0, ["The refers to a specific building.", "A refers to a building.", "An is wrong before p."], "Institution for its purpose.", "in prison."),
      t.tr("lesson-13-t4", "What an incredible view!", "SUCH", "It was ____ incredible view!", ["such an"], "Such a / an.", "such an."),
      t.gap("lesson-13-t5", "What ____ nightmare the journey home turned out to be!", ["a"], "What a + noun.", "what a."),
    ],
  };
})();

// ───────────────────────────── 14. Reading: inference & attitude ─────────────────────────────
const L14: Lesson = (() => {
  const p = qb("reading", "inference", "C1", "technology");
  const t = qb("reading", "inference", "C1", "technology");
  return {
    id: "lesson-14",
    title: "Reading: inference and writer’s attitude",
    skill: "reading",
    topic: "inference",
    level: "C1",
    theme: "technology",
    minutes: 16,
    objective: "Infer meaning and identify the writer’s attitude by reading evaluative language closely.",
    explanation: [
      "Cambridge questions often ask what a text **implies**, not what it says. Look for hedges (supposedly, so we are assured), concession (admittedly, yet), loaded adjectives, reporting verbs (insist, claim) and irony. These signal the writer’s attitude.",
      "Method: (1) read the paragraph, (2) underline evaluative words, (3) predict the answer, (4) eliminate options that are too extreme or that repeat a detail without answering the question. Always ask: which words prove this?",
      "Practise with this paragraph. “It is hardly surprising that voice assistants have been welcomed into millions of homes. They are, after all, convenient, tireless and — so we are assured — entirely benign. Yet one might reasonably wonder why a device that supposedly exists to serve us should be so eager to learn our habits, our schedules and the sound of our children’s voices. The manufacturers insist that the data is anonymised. They have been markedly less forthcoming about who, exactly, benefits from it.”",
    ],
    explanationEs: "No respondas con tu opinión: justifica con las palabras del texto. Cuidado con expresiones como so we are assured o supposedly, que indican escepticismo del autor.",
    examples: [
      { sentence: "“so we are assured”", note: "Signals the writer does not fully believe it." },
      { sentence: "“supposedly exists to serve us”", note: "Supposedly = the writer doubts the claim." },
      { sentence: "“markedly less forthcoming”", note: "Implies evasiveness." },
      { sentence: "“one might reasonably wonder”", note: "Polite way of voicing criticism." },
    ],
    practice: [
      p.mcq("lesson-14-p1", "What is the writer’s attitude towards the manufacturers’ claims about data?", ["Sceptical", "Admiring", "Neutral", "Indifferent"], 0, ["Nothing in the text shows admiration.", "The tone is clearly evaluative.", "The writer clearly cares."], "Words like insist and less forthcoming show doubt.", "El autor desconfía."),
      p.mcq("lesson-14-p2", "What is implied by “so we are assured”?", ["The writer doubts that the devices are entirely harmless.", "The writer has been personally reassured.", "The manufacturers have proved the devices safe.", "The assistants are certainly benign."], 0, ["The phrase distances the writer from the claim.", "Assured here is reported, not personal.", "Nothing is proved."], "The phrase signals scepticism.", "so we are assured = según nos dicen."),
      p.mcq("lesson-14-p3", "The phrase “markedly less forthcoming” suggests the manufacturers", ["avoid giving a clear answer about who profits", "have refused all interviews", "openly admit selling data", "are unable to understand the question"], 0, ["Refusing all interviews is not stated.", "They do not admit it.", "Not about ability."], "Less forthcoming = reluctant to share.", "forthcoming = dispuesto a dar información."),
      p.mcq("lesson-14-p4", "Why does the writer mention “the sound of our children’s voices”?", ["To highlight how personal the collected data is", "To praise the sound quality", "To suggest children use them more", "To show that parents are careless"], 0, ["Not about quality.", "Not about use.", "Not about parents."], "The detail makes the intrusion personal.", "Detalle emocional."),
      p.mcq("lesson-14-p5", "What is the main purpose of the paragraph?", ["To question whether the benefits of voice assistants are as clear as claimed", "To explain how voice assistants work", "To compare different brands", "To advise readers to buy one"], 0, ["No technical explanation.", "No brands.", "No advice to buy."], "The writer questions motives.", "Propósito crítico."),
    ],
    vocabulary: [
      { term: "anonymised", meaning: "with personal details removed", example: "Anonymised data can still be traced." },
      { term: "benign", meaning: "harmless", example: "A benign tumour." },
      { term: "forthcoming", meaning: "willing to give information", example: "He was not forthcoming about his plans." },
      { term: "intrusive", meaning: "disturbing privacy", example: "Intrusive advertising." },
      { term: "surveillance", meaning: "close observation, especially by authorities", example: "Mass surveillance." },
    ],
    test: [
      t.mcq("lesson-14-t1", "“The scheme was launched with great fanfare, but its results have yet to be seen.” What does the writer imply?", ["The scheme has so far achieved little", "The scheme was never launched", "The results are secret", "The scheme has been a success"], 0, ["It was launched.", "Not secret, simply absent.", "The opposite of the but-clause."], "But … have yet to be seen implies no results.", "have yet to be seen = aún no se ven."),
      t.mcq("lesson-14-t2", "“She described the proposal as ‘interesting’, a word she has been known to use of things she dislikes.” What is the writer’s point?", ["“Interesting” may conceal disapproval.", "She admires the proposal.", "She never uses the word.", "The writer finds the proposal fascinating."], 0, ["Contradicts the second clause.", "Contradicts the second clause.", "The writer is not fascinated."], "The second clause undercuts the praise.", "Ironía."),
      t.mcq("lesson-14-t3", "“Admittedly, the film is beautifully shot; but one cannot live on cinematography alone.” The writer’s attitude is", ["critical despite some praise", "wholly enthusiastic", "bored and uninterested", "entirely hostile"], 0, ["Not wholly enthusiastic.", "Not bored.", "Some praise exists."], "Admittedly … but signals concession then criticism.", "admittedly … but."),
      t.mcq("lesson-14-t4", "“The council, ever alert to the needs of its citizens, closed the library for the third time this year.” The phrase “ever alert” is used", ["ironically", "literally", "admiringly", "defensively"], 0, ["The facts contradict it.", "Not admiring.", "Not defending."], "The writer mocks the council.", "irónico."),
      t.mcq("lesson-14-t5", "“Few would deny that the reforms were overdue. Fewer still would claim they were well executed.” What does the writer suggest?", ["The reforms were necessary but badly carried out.", "The reforms were unnecessary.", "The reforms were perfectly executed.", "Everyone denies the reforms were overdue."], 0, ["Few would deny overdue.", "They were not well executed.", "Opposite of the text."], "Few would deny + fewer still.", "Fewer still = aún menos."),
    ],
  };
})();

// ───────────────────────────── 15. Idioms for opinions ─────────────────────────────
const L15: Lesson = (() => {
  const p = qb("speaking", "idioms", "C1", "culture");
  const t = qb("speaking", "idioms", "C1", "culture");
  return {
    id: "lesson-15",
    title: "Idioms for opinions and discussions",
    skill: "speaking",
    topic: "idioms",
    level: "C1",
    theme: "culture",
    minutes: 13,
    objective: "Use a handful of natural idioms to give opinions and manage a discussion without sounding rehearsed.",
    explanation: [
      "Idioms add colour in the Speaking paper, but one or two per answer is plenty. Opinion: **in my book** (in my view), **to my mind**, **if you ask me**, **at the end of the day** (ultimately), **the bottom line is**, **hit the nail on the head**.",
      "Discussion: **sit on the fence** (refuse to take sides), **beat around the bush**, **play devil’s advocate**, **see eye to eye**, **split hairs**, **get to the heart of the matter**, **be on the same page**, **take it with a pinch of salt**, **go back to square one**, **bite the bullet**, **agree to differ**.",
      "Idioms are fixed: do not change words (hit the nail on the head, not in the head). They are neutral to informal; avoid them in formal writing.",
    ],
    explanationEs: "No traduzcas literalmente: “dar vueltas al asunto” = beat around the bush. Y no cambies las palabras: hit the nail on the head.",
    examples: [
      { sentence: "In my book, the film is overrated.", note: "In my book = in my opinion." },
      { sentence: "Stop beating around the bush and tell us what you think.", note: "Avoiding the point." },
      { sentence: "At the end of the day, it’s your decision.", note: "Ultimately." },
      { sentence: "I hate to play devil’s advocate, but is it realistic?", note: "Arguing the opposite." },
      { sentence: "We just don’t see eye to eye on this.", note: "Disagreement." },
    ],
    practice: [
      p.mcq("lesson-15-p1", "Stop ____ and tell us what you really think.", ["beating around the bush", "sitting on the fence", "splitting hairs", "hitting the nail"], 0, ["Sitting on the fence is not taking sides.", "Splitting hairs is arguing about tiny details.", "Incomplete idiom."], "Beat around the bush = avoid the point.", "beat around the bush."),
      p.gap("lesson-15-p2", "To be honest, I think she hit the nail on the ____ with that comment.", ["head"], "Hit the nail on the head = exactly right.", "head."),
      p.mcq("lesson-15-p3", "He never takes sides; he always ____.", ["sits on the fence", "plays devil’s advocate", "takes it with a pinch of salt", "goes back to square one"], 0, ["Devil’s advocate argues the opposite.", "A pinch of salt is scepticism.", "Square one is starting again."], "Sit on the fence.", "sit on the fence."),
      p.tr("lesson-15-p4", "I don’t agree with her about this.", "EYE", "I don’t ____ her about this.", ["see eye to eye with"], "See eye to eye with.", "see eye to eye."),
      p.tr("lesson-15-p5", "Frankly, the most important point is that we can’t afford it.", "BOTTOM", "The ____ is that we can’t afford it.", ["bottom line"], "The bottom line.", "bottom line."),
    ],
    vocabulary: [
      { term: "common ground", meaning: "shared points of agreement", example: "We found common ground." },
      { term: "heated debate", meaning: "an angry, intense discussion", example: "A heated debate broke out." },
      { term: "dissenting voice", meaning: "a person who disagrees", example: "One dissenting voice." },
      { term: "hold strong views", meaning: "to have firm opinions", example: "She holds strong views on art." },
      { term: "back down", meaning: "to withdraw a claim", example: "He refused to back down." },
    ],
    test: [
      t.mcq("lesson-15-t1", "We’ve been arguing for hours and we’re back to ____.", ["square one", "square zero", "the first line", "point nothing"], 0, ["Not the idiom.", "Not the idiom.", "Not the idiom."], "Back to square one.", "square one."),
      t.gap("lesson-15-t2", "I’ll just play devil’s ____ for a moment: what if it doesn’t work?", ["advocate"], "Play devil’s advocate.", "advocate."),
      t.tr("lesson-15-t3", "Stop arguing about tiny, unimportant details.", "HAIRS", "Stop ____ hairs.", ["splitting"], "Split hairs.", "split hairs."),
      t.mcq("lesson-15-t4", "Which idiom means “ultimately”?", ["At the end of the day", "Off the top of my head", "In the heat of the moment", "By the book"], 0, ["Means without checking.", "Means impulsively.", "Means strictly following rules."], "At the end of the day.", "at the end of the day."),
      t.tr("lesson-15-t5", "We just have to accept the unpleasant reality and cut the budget.", "BULLET", "We just have to ____ and cut the budget.", ["bite the bullet"], "Bite the bullet.", "bite the bullet."),
    ],
  };
})();

// ───────────────────────────── 16. Verb patterns & subjunctive ─────────────────────────────
const L16: Lesson = (() => {
  const p = qb("grammar", "verb-patterns", "C1+", "society");
  const t = qb("grammar", "verb-patterns", "C1+", "society");
  return {
    id: "lesson-16",
    title: "Advanced verb patterns and the subjunctive",
    skill: "grammar",
    topic: "verb-patterns",
    level: "C1+",
    theme: "society",
    minutes: 16,
    objective: "Choose the right verb pattern and use the mandative subjunctive in formal contexts.",
    explanation: [
      "Some verbs change meaning with -ing or to-infinitive: **stop to rest / stop resting**, **remember to lock / remember locking**, **regret to inform / regret saying**, **try to open / try opening**. Learn the pattern of each verb: **avoid, consider, deny, enjoy, risk, suggest + -ing**; **afford, manage, refuse, tend, fail + to-infinitive**; **make / let + object + base verb** (be made to + infinitive in the passive).",
      "**Mandative subjunctive**: after demand, insist, recommend, suggest, propose, require, and adjectives like essential, vital, important, the verb stays in the base form: It is essential that every candidate **be** informed. I suggest that she **see** a specialist. Negative: that he **not** leave.",
      "Other subjunctive forms: **were** (If I were you; as if he were), wish / if only + past, and **it’s high time** + past simple.",
    ],
    explanationEs: "Trampa: “Es esencial que sea informado” = It is essential that he be informed (no is/to be). Y “quiero que vengas” = I want you to come (no “I want that you come”).",
    examples: [
      { sentence: "It is vital that every employee follow the safety rules.", note: "Subjunctive: no -s." },
      { sentence: "She regrets telling him the truth; it ruined their friendship.", note: "Regret + -ing = past." },
      { sentence: "I was made to redo the report.", note: "Passive of make + to." },
      { sentence: "It’s high time the government did something about housing.", note: "High time + past simple." },
      { sentence: "If only she had been aware of the risks.", note: "If only + past perfect." },
    ],
    practice: [
      p.mcq("lesson-16-p1", "It is vital that every employee ____ the safety rules.", ["follow", "follows", "to follow", "is following"], 0, ["Follows is not subjunctive.", "To follow is wrong after that.", "Is following does not fit."], "Mandative subjunctive uses the base form.", "follow (sin -s)."),
      p.gap("lesson-16-p2", "If only she ____ aware of the risks when she signed.", ["had been"], "If only + past perfect expresses regret.", "had been."),
      p.mcq("lesson-16-p3", "She regrets ____ him the truth; it ruined their friendship.", ["telling", "to tell", "tell", "to telling"], 0, ["Regret to tell = sorry to announce.", "Regret + base is wrong.", "To telling is wrong."], "Regret + -ing = past action.", "regret + -ing."),
      p.tr("lesson-16-p4", "My manager made me redo the entire report.", "MADE", "I ____ redo the entire report by my manager.", ["was made to"], "Passive of make takes to.", "was made to."),
      p.tr("lesson-16-p5", "It is essential for all candidates to be informed of the rules.", "THAT", "It is essential ____ all candidates be informed of the rules.", ["that"], "Essential that + subjunctive.", "that."),
    ],
    vocabulary: [
      { term: "mandate", meaning: "an official order or authority to do something", example: "The government has a mandate to reform." },
      { term: "stipulate", meaning: "to demand as a condition", example: "The contract stipulates a notice period." },
      { term: "abide by", meaning: "to follow a rule", example: "You must abide by the rules." },
      { term: "compliance", meaning: "obeying rules", example: "Compliance is mandatory." },
      { term: "uphold", meaning: "to support or maintain", example: "The court upheld the decision." },
    ],
    test: [
      t.mcq("lesson-16-t1", "The committee recommended that the proposal ____ until next year.", ["be postponed", "is postponed", "would postponed", "to be postponed"], 0, ["Is is not subjunctive.", "Would postponed is wrong.", "To be is wrong after that."], "Recommend that + base form.", "be postponed."),
      t.gap("lesson-16-t2", "It’s high time the government ____ something about housing costs.", ["did"], "High time + past simple.", "did."),
      t.tr("lesson-16-t3", "I paused my work to answer the phone.", "STOPPED", "I ____ to answer the phone.", ["stopped working", "stopped what i was doing"], "Stop + -ing = quit; stop to + inf = purpose.", "stopped working."),
      t.mcq("lesson-16-t4", "Which sentence is correct?", ["She suggested that he apply for the scholarship.", "She suggested him to apply for the scholarship.", "She suggested that he to apply for the scholarship.", "She suggested him applying for the scholarship."], 0, ["Suggest him to is wrong.", "To is wrong.", "Suggested him applying is wrong."], "Suggest that + subjunctive.", "suggest that."),
      t.tr("lesson-16-t5", "I’d prefer it if you didn’t smoke here.", "RATHER", "I’d ____ you didn’t smoke here.", ["rather"], "I’d rather you didn’t + base.", "I’d rather."),
    ],
  };
})();

export const LESSONS: Lesson[] = [L01, L02, L03, L04, L05, L06, L07, L08, L09, L10, L11, L12, L13, L14, L15, L16];
