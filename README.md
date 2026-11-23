# VERBA

**Your personal path to fluency.** A personal English coach for Cambridge C1 Advanced (CAE), built for a Spanish speaker who already holds B2 First.

VERBA measures your level in each skill separately, remembers every mistake, builds a daily plan around your time and exam date, and adapts as you improve. It works fully offline in the browser. Claude can be switched on for the AI tutor and examiner-style writing feedback.

## Use it on the web (GitHub Pages)

Open **https://secundariaxdx-dot.github.io/VERBA/** (it redirects to the app in `/VERBA/docs/`).

GitHub Pages serves this repository from **main / (root)**. The built app lives in `docs/`, and `index.html` at the root redirects to it. The workflow `.github/workflows/pages.yml` rebuilds `docs/` automatically whenever the source changes. To rebuild by hand: `npm run build:pages`.

On a phone, open the link and add it to the home screen to use VERBA as an app (iPhone: Safari → Share → *Add to Home Screen*; Android: Chrome → *Install app*). Progress is stored on each device. To move it to another device, use Settings → Export / Import backup.

GitHub Pages has no server, so the web version always uses the offline tutor and writing analyser. Claude is available only when you run VERBA yourself with a key (see below).

## Run it locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open <http://localhost:3100>. On first launch you can **set up your plan** (onboarding, then the adaptive diagnostic) or **explore with sample progress** (three weeks of demo data, which you can clear later in Settings).

Other commands:

```bash
npm test            # engine + content tests (vitest)
npm run lint        # eslint
npm run typecheck   # TypeScript
npm run build && npm start   # production build on port 3100
npm run e2e         # end-to-end workflows with Playwright (needs the app running on :3100)
```

### Optional: enable Claude

```bash
cp .env.example .env.local
# then put your key in .env.local:  ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

The key is read only by the server routes in `src/app/api/*` and never reaches the browser. Without a key, those routes answer `503` and VERBA uses its local engines. The status is shown in Settings and on the Tutor page.

## What's inside

| Area | What it does |
| --- | --- |
| **Dashboard** | Greeting, level now → C1 target, progress ring, daily goal, streak, today's lesson and why it was chosen, today's plan, skill breakdown, weekly activity chart, focus areas, next assessment, review queue, milestones |
| **Onboarding + diagnostic** | 7 onboarding questions, then 7 short adaptive sections (grammar, vocabulary, Use of English, reading, listening, writing, speaking). Each section starts at B2+, adapts to your answers, can be done in a separate session, and produces its own level (B2 / B2+ / Approaching C1 / C1 / C1+) |
| **Study plan** | Daily sessions built from your diagnostic, mistakes, time and exam date: review first, then the lesson, targeted practice, a weak-skill block and new vocabulary, plus a weekly exam simulation. Week view with done/skip, monthly milestones, skill goals and an editable schedule |
| **Daily lessons** | 16 lessons: objective → explanation (with a Spanish summary) → examples → practice with feedback → vocabulary notes → mini-test → results |
| **Use of English** | 72 original items across the 4 C1 parts, plus 36 grammar items. Learning and exam modes. Explanations, notes on the wrong options, Spanish notes, adaptive sets, and a tracker for 17 grammar/vocabulary concepts |
| **Reading** | 8 original texts from B2 to C1+ in 8 genres, 6 questions each (main idea, detail, inference, attitude, meaning from context, structure). Reading speed, a glossary you can save to Vocabulary, and accuracy by question type |
| **Listening** | 7 recordings voiced by browser text-to-speech in several accents. Learning mode (replay, 0.8×/0.9×, transcript afterwards) and exam mode (two plays). Accuracy by question type and by accent |
| **Writing** | 8 tasks (essay, report, review, proposal, letter, email) with a timer, word count and autosaved drafts. Feedback on the 4 Cambridge criteria plus checks, corrections of typical Spanish-speaker errors, C1 upgrades, a model answer and history |
| **Speaking** | 10 tasks covering Parts 1–4: prep and speaking timers, microphone recording, live transcription where the browser supports it, and a typed fallback. Feedback on fluency, range, linking and C1 phrases |
| **Vocabulary** | 72 entries (definition, Spanish note, IPA, synonyms, collocations, register, level). Search and filters, saving, personal examples, pronunciation, SM-2 flashcards (forgotten words come back sooner), quizzes, difficult words and custom words |
| **Mock exams** | 2 full mocks and 3 single-paper simulations, in timed exam mode or learning mode. Report with scale score, grade, papers, skills, error patterns, next steps and C1 readiness — clearly marked as unofficial |
| **My mistakes** | Every wrong answer with its explanation, repeat count, mastery stage (new → mastered) and spaced reviews. Filters, practice mode and "similar questions". Repeated mistakes push their topic up the plan |
| **Statistics** | Week / month / all-time filters: study time, level over time, accuracy by skill, reading/listening/UoE/writing/speaking/mock trends, a 12-week heatmap, personal bests and achievements |
| **AI tutor** | Explains your last mistake, explains rules in Spanish, gives similar questions (answerable inline), compares expressions, reviews your essay, starts speaking practice, quizzes your vocabulary and builds today's session. Uses Claude when enabled |

All content is original. None of it is copied from Cambridge papers. All levels and grades are **unofficial estimates** on the Cambridge English Scale (160–179 B2, 180–199 C1).

## Architecture

```
src/
  domain/types.ts        Data model (profile, levels, attempts, mistakes, vocab, plan, writing, speaking, mocks…)
  data/                  Content banks + demo data + content tests
  engine/                Pure logic, unit-tested
    adaptive.ts          Ability model (Elo/IRT-style), adaptive item picking, weak-topic ranking
    planner.ts           Daily/weekly plan, lesson recommendation, milestones, skill goals
    srs.ts               SM-2 spaced repetition + mistake review schedule
    writingEval.ts       Offline writing analyser (rubric, Spanish-speaker error rules, C1 upgrades)
    speakingEval.ts      Transcript analysis (pace, range, linking, C1 phrases)
    tutor.ts             Offline tutor + learner context for Claude
    stats.ts, achievements.ts, levels.ts, check.ts, sets.ts
  store/verba.ts         Zustand store, persisted through services/storage
  services/storage       localStorage adapter (cloud adapter interface for Phase 4)
  services/ai            Client calls to VERBA's own API routes (no keys in the browser)
  lib/server/claude.ts   Server-only Claude client (claude-opus-5-5, refusal fallback, structured output)
  app/                   Next.js 16 App Router pages + /api/ai, /api/tutor, /api/writing
  components/            Design system (tokens in app/globals.css), charts, exercise and skill components
```

Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, lucide icons, Fraunces + Inter fonts, and hand-built SVG charts.

**Persistence.** All data is stored in the browser under the key `verba-v1`. Settings has export and import of a JSON backup. For Phase 4 (accounts and cloud sync), `supabase/schema.sql` defines a per-user state table with row-level security, and `services/storage` defines the adapter interface to implement.

## Known limits

- Listening and pronunciation depend on the browser: text-to-speech voices vary by OS, and speech recognition works in Chrome, Edge and Safari. Firefox falls back to the transcript and typed answers.
- The offline writing and speaking analysers measure what can be measured without AI: coverage, cohesion, range, register and a catalogue of common errors. They don't understand meaning the way an examiner or Claude does. Enable Claude for richer writing feedback.
- Phase 4 items (authentication, cloud sync) are scaffolded but not implemented.

## Claude Code skill

The project ships the **enrutador** skill in `.claude/skills/enrutador/` (a model-routing skill by Víctor Corral). Type `/enrutador` followed by a task in Claude Code to use it.
