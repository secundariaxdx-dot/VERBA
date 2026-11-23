"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookText, Check, Ear, Gauge, Mic, PenLine, Puzzle, RotateCcw, Shapes, Type } from "lucide-react";
import type { DiagnosticSection, Question, WritingTask } from "@/domain/types";
import { diagnosticPool, READING, LISTENING, WRITING_TASKS, SPEAKING_TASKS } from "@/data";
import { useVerba } from "@/store/verba";
import { pickAdaptive, updateAbility } from "@/engine/adaptive";
import { LEVEL_DIFFICULTY, SKILL_LABEL, START_ABILITY, bandFor, levelFor } from "@/engine/levels";
import { evaluateWriting } from "@/engine/writingEval";
import { evaluateSpeaking } from "@/engine/speakingEval";
import { QuestionCard } from "@/components/exercise/QuestionCard";
import { QuizRunner, type QuizResult } from "@/components/exercise/QuizRunner";
import { ReadingTask } from "@/components/skills/ReadingTask";
import { ListeningPlayer } from "@/components/skills/ListeningPlayer";
import { Badge, Button, ButtonLink, Card, PageHeader, ProgressBar, cx } from "@/components/ui/primitives";
import { SkillBars } from "@/components/charts/Charts";
import { createRecognition, recognitionSupported } from "@/lib/speech";
import { wordCount } from "@/lib/text";
import { minutesSince, now } from "@/lib/dates";

const SECTIONS: { key: DiagnosticSection; title: string; minutes: number; icon: typeof Gauge; desc: string }[] = [
  { key: "grammar", title: "Grammar", minutes: 5, icon: Type, desc: "8 adaptive items, from B2 to C1+" },
  { key: "vocabulary", title: "Vocabulary & collocations", minutes: 5, icon: Shapes, desc: "Meaning, collocations, phrasal verbs" },
  { key: "useOfEnglish", title: "Use of English", minutes: 7, icon: Puzzle, desc: "Open cloze, word formation, transformations" },
  { key: "reading", title: "Reading", minutes: 8, icon: BookText, desc: "One text matched to your level" },
  { key: "listening", title: "Listening", minutes: 6, icon: Ear, desc: "One recording (text-to-speech)" },
  { key: "writing", title: "Writing", minutes: 15, icon: PenLine, desc: "A short opinion paragraph, 120–180 words" },
  { key: "speaking", title: "Speaking", minutes: 3, icon: Mic, desc: "One minute on a discussion question" },
];

const ITEMS = 8;

/** Convert a percentage on a text of known level into a scale estimate. */
function scoreFromText(levelDiff: number, pct: number) {
  return Math.round(Math.max(150, Math.min(205, levelDiff + (pct - 0.65) * 40)));
}

export default function Diagnostic() {
  const diag = useVerba((s) => s.diagnostic);
  const levels = useVerba((s) => s.levels);
  const resetDiagnostic = useVerba((s) => s.resetDiagnostic);
  const [active, setActive] = useState<DiagnosticSection | null>(null);
  const done = Object.keys(diag.completed).length;

  if (active) return <SectionRunner key={active} section={active} onExit={() => setActive(null)} />;

  return (
    <div>
      <PageHeader
        eyebrow="Diagnostic assessment"
        title={done === 7 ? "Your level report" : "Find your real level"}
        subtitle="Adaptive: each section starts at B2+ and adjusts to your answers. Do one section at a time — your progress is saved and you can continue whenever you like."
        action={
          done > 0 ? (
            <Button variant="ghost" onClick={() => confirm("Reset all diagnostic results? Your other progress is kept.") && resetDiagnostic()}>
              <RotateCcw size={15} /> Retake from scratch
            </Button>
          ) : undefined
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          {SECTIONS.map((s, i) => {
            const r = diag.completed[s.key];
            const Icon = s.icon;
            return (
              <Card key={s.key} className={cx("flex items-center gap-4 p-4 sm:p-5", r && "bg-paper/70")}>
                <div className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", r ? "bg-ok-50 text-ok" : "bg-accent-50 text-accent")}>{r ? <Check size={19} /> : <Icon size={19} />}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-medium text-ink">
                      {i + 1}. {s.title}
                    </span>
                    {r && <Badge tone={r.score >= 180 ? "ok" : "accent"}>{bandFor(r.score).label}</Badge>}
                  </div>
                  <div className="text-[12.5px] text-muted">
                    {r ? `${r.correct}/${r.total} · estimate ${r.score}` : `${s.desc} · ~${s.minutes} min`}
                  </div>
                </div>
                <Button variant={r ? "secondary" : "primary"} size="sm" onClick={() => setActive(s.key)}>
                  {r ? "Redo" : diag.current?.section === s.key ? "Resume" : "Start"}
                </Button>
              </Card>
            );
          })}
        </div>
        <Card className="h-fit p-6">
          <div className="eyebrow mb-1">Report</div>
          <h3 className="mb-4 text-lg text-ink">{done === 0 ? "Complete a section to see results" : `${done} of 7 sections assessed`}</h3>
          <ProgressBar value={done} max={7} className="mb-5" />
          <SkillBars levels={levels} />
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">Sections not yet assessed use your self-assessment from onboarding. Skills can differ by a whole band — that’s normal, and your study plan uses each skill separately. These are unofficial estimates, not Cambridge scores.</p>
          {done === 7 && (
            <ButtonLink href="/plan" className="mt-4">
              See my study plan <ArrowRight size={15} />
            </ButtonLink>
          )}
        </Card>
      </div>
    </div>
  );
}

function SectionShell({ section, children, onExit, progress }: { section: DiagnosticSection; children: React.ReactNode; onExit: () => void; progress?: number }) {
  const s = SECTIONS.find((x) => x.key === section)!;
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Diagnostic · {SKILL_LABEL[section]}</div>
          <h1 className="text-2xl text-ink">{s.title}</h1>
        </div>
        <Button variant="ghost" onClick={onExit}>
          Save & exit
        </Button>
      </div>
      {progress !== undefined && <ProgressBar value={progress} max={1} className="mb-6" />}
      {children}
    </div>
  );
}

function Result({ section, score, onExit }: { section: DiagnosticSection; score: number; onExit: () => void }) {
  const b = bandFor(score);
  return (
    <Card className="animate-rise mx-auto max-w-xl p-8 text-center">
      <div className="eyebrow mb-2">{SKILL_LABEL[section]} result</div>
      <div className="font-display text-5xl text-ink">{b.label}</div>
      <div className="mt-1 text-[13px] text-muted">{score} on the Cambridge scale (unofficial estimate)</div>
      <p className="mt-4 text-[14.5px] text-ink-2">{b.description}. Your plan has been updated.</p>
      <Button className="mt-6" onClick={onExit}>
        Back to the diagnostic <ArrowRight size={15} />
      </Button>
    </Card>
  );
}

function SectionRunner({ section, onExit }: { section: DiagnosticSection; onExit: () => void }) {
  if (section === "grammar" || section === "vocabulary" || section === "useOfEnglish") return <AdaptiveItems section={section} onExit={onExit} />;
  if (section === "reading") return <ReadingSection onExit={onExit} />;
  if (section === "listening") return <ListeningSection onExit={onExit} />;
  if (section === "writing") return <WritingSection onExit={onExit} />;
  return <SpeakingSection onExit={onExit} />;
}

function AdaptiveItems({ section, onExit }: { section: "grammar" | "vocabulary" | "useOfEnglish"; onExit: () => void }) {
  const current = useVerba((s) => s.diagnostic.current);
  const start = useVerba((s) => s.startDiagnostic);
  const step = useVerba((s) => s.diagnosticStep);
  const finish = useVerba((s) => s.finishDiagnostic);
  const recordAnswer = useVerba((s) => s.recordAnswer);
  const logSession = useVerba((s) => s.logSession);
  const pool = useMemo(() => diagnosticPool(section), [section]);
  const resuming = current?.section === section;
  const [state, setState] = useState(() => (resuming ? { ability: current!.ability, asked: current!.asked, correct: current!.correct, total: current!.total } : { ability: START_ABILITY, asked: [] as string[], correct: 0, total: 0 }));
  const [result, setResult] = useState<number | null>(null);
  const [startedAt] = useState(now);
  const [q, setQ] = useState<Question | undefined>(() => pickAdaptive(pool, resuming ? current!.ability : START_ABILITY, new Set(resuming ? current!.asked : [])));
  useEffect(() => {
    if (!resuming) start(section, START_ABILITY);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function answered(correct: boolean, answer: string) {
    if (!q) return;
    recordAnswer(q, answer, correct, "diagnostic");
    const ability = updateAbility(state.ability, q.level, correct, state.total);
    const next = { ability, asked: [...state.asked, q.id], correct: state.correct + (correct ? 1 : 0), total: state.total + 1 };
    step(q.id, correct, ability);
    setState(next);
    if (next.total >= ITEMS) {
      const score = Math.round(ability);
      finish(section, score, next.correct, next.total);
      logSession({ minutes: minutesSince(startedAt), activity: "diagnostic", skill: section, title: `Diagnostic: ${SKILL_LABEL[section]}`, score: Math.round((next.correct / next.total) * 100) });
      setResult(score);
    } else setQ(pickAdaptive(pool, ability, new Set(next.asked)));
  }

  if (result !== null) return <Result section={section} score={result} onExit={onExit} />;
  return (
    <SectionShell section={section} onExit={onExit} progress={state.total / ITEMS}>
      <Card className="mx-auto max-w-3xl p-5 sm:p-7">
        <p className="mb-5 text-[13px] text-muted">
          Question {state.total + 1} of {ITEMS}. No feedback during the diagnostic — the next item adapts to your answer.
        </p>
        {q && <QuestionCard key={q.id} q={q} mode="exam" onAnswered={answered} showMeta={false} />}
      </Card>
    </SectionShell>
  );
}

function useSectionFinish(section: DiagnosticSection) {
  const finish = useVerba((s) => s.finishDiagnostic);
  const logSession = useVerba((s) => s.logSession);
  const [startedAt] = useState(now);
  return (score: number, correct: number, total: number) => {
    finish(section, score, correct, total);
    logSession({ minutes: minutesSince(startedAt), activity: "diagnostic", skill: section, title: `Diagnostic: ${SKILL_LABEL[section]}`, score: Math.round((correct / Math.max(1, total)) * 100) });
  };
}

function useEntryLevel() {
  const levels = useVerba((s) => s.levels);
  return levelFor((levels.grammar.score + levels.vocabulary.score) / 2 + 2);
}

function ReadingSection({ onExit }: { onExit: () => void }) {
  const level = useEntryLevel();
  const text = READING.find((t) => t.level === level) ?? READING.find((t) => t.level === "B2+")!;
  const done = useSectionFinish("reading");
  const [result, setResult] = useState<number | null>(null);
  if (result !== null) return <Result section="reading" score={result} onExit={onExit} />;
  return (
    <SectionShell section="reading" onExit={onExit}>
      <ReadingTask
        text={text}
        mode="exam"
        source="diagnostic"
        log={false}
        onFinish={(r: QuizResult) => {
          const s = scoreFromText(LEVEL_DIFFICULTY[text.level], r.correct / r.total);
          done(s, r.correct, r.total);
          setResult(s);
        }}
      />
    </SectionShell>
  );
}

function ListeningSection({ onExit }: { onExit: () => void }) {
  const level = useEntryLevel();
  const track = LISTENING.find((t) => t.level === level) ?? LISTENING[0];
  const done = useSectionFinish("listening");
  const [result, setResult] = useState<number | null>(null);
  if (result !== null) return <Result section="listening" score={result} onExit={onExit} />;
  return (
    <SectionShell section="listening" onExit={onExit}>
      <div className="grid gap-6 lg:grid-cols-2">
        <ListeningPlayer track={track} mode="exam" showTranscript={false} />
        <Card className="p-5 sm:p-7">
          <QuizRunner
            questions={track.questions}
            source="diagnostic"
            title="Diagnostic listening"
            skill="listening"
            activity="listening"
            mode="exam"
            log={false}
            onFinish={(r) => {
              const s = scoreFromText(LEVEL_DIFFICULTY[track.level], r.correct / r.total);
              done(s, r.correct, r.total);
              setResult(s);
            }}
          />
        </Card>
      </div>
    </SectionShell>
  );
}

function WritingSection({ onExit }: { onExit: () => void }) {
  const base = WRITING_TASKS.find((t) => t.genre === "essay") ?? WRITING_TASKS[0];
  const task: WritingTask = { ...base, wordRange: [120, 180], requirements: base.requirements.slice(0, 2), contentKeywords: base.contentKeywords.slice(0, 2) };
  const [text, setText] = useState("");
  const done = useSectionFinish("writing");
  const [result, setResult] = useState<number | null>(null);
  if (result !== null) return <Result section="writing" score={result} onExit={onExit} />;
  const words = wordCount(text);
  return (
    <SectionShell section="writing" onExit={onExit}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 sm:p-6">
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[45vh] w-full rounded-2xl border border-line bg-paper p-5 font-display text-[16.5px] leading-relaxed focus:border-accent focus:outline-none" placeholder="Write 120–180 words. Use paragraphs." aria-label="Your answer" />
          <div className="mt-3 flex items-center justify-between">
            <span className={cx("tabular text-[13.5px]", words >= 120 ? "text-ok" : "text-muted")}>{words} words</span>
            <Button
              disabled={words < 60}
              onClick={() => {
                const fb = evaluateWriting(text, task);
                done(fb.scaleScore, Math.round(fb.criteria.reduce((s, c) => s + c.band, 0)), 20);
                setResult(fb.scaleScore);
              }}
            >
              Submit
            </Button>
          </div>
        </Card>
        <Card className="h-fit p-5">
          <div className="eyebrow mb-2">Task</div>
          <p className="text-[14.5px] leading-relaxed text-ink-2">{base.prompt}</p>
          <p className="mt-3 text-[13px] text-muted">For the diagnostic, write a shorter version (120–180 words) focusing on: {task.requirements.join("; ")}.</p>
        </Card>
      </div>
    </SectionShell>
  );
}

function SpeakingSection({ onExit }: { onExit: () => void }) {
  const task = SPEAKING_TASKS.find((t) => t.part === "discussion") ?? SPEAKING_TASKS[0];
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [secs, setSecs] = useState(0);
  const rec = useRef<ReturnType<typeof createRecognition>>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalText = useRef("");
  const done = useSectionFinish("speaking");
  const [result, setResult] = useState<number | null>(null);
  const supported = typeof window !== "undefined" && recognitionSupported();

  function startRec() {
    const r = createRecognition("en-GB");
    if (!r) return;
    finalText.current = text ? text + " " : "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText.current += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setText((finalText.current + interim).trim());
    };
    r.onend = () => setListening(false);
    r.start();
    rec.current = r;
    setListening(true);
    setSecs(0);
    timer.current = setInterval(() => setSecs((s) => (s >= 59 ? (stopRec(), 60) : s + 1)), 1000);
  }
  function stopRec() {
    rec.current?.stop();
    if (timer.current) clearInterval(timer.current);
    setListening(false);
  }

  if (result !== null) return <Result section="speaking" score={result} onExit={onExit} />;
  return (
    <SectionShell section="speaking" onExit={onExit}>
      <Card className="mx-auto max-w-3xl p-6 sm:p-8">
        <div className="eyebrow mb-2">Speak for about one minute</div>
        <p className="font-display text-[1.4rem] leading-snug text-ink">{task.questions[0]}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {supported ? (
            listening ? (
              <Button variant="danger" onClick={stopRec}>
                Stop ({60 - secs}s)
              </Button>
            ) : (
              <Button onClick={startRec}>
                <Mic size={16} /> Record answer
              </Button>
            )
          ) : (
            <span className="text-[13px] text-muted">Speech recognition isn’t available in this browser — type your answer as you would say it.</span>
          )}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} className="mt-4 min-h-40 w-full rounded-2xl border border-line bg-paper p-4 text-[15px] focus:border-accent focus:outline-none" placeholder="Your transcript appears here (you can correct it)…" aria-label="Transcript" />
        <Button
          className="mt-4"
          disabled={wordCount(text) < 25}
          onClick={() => {
            const fb = evaluateSpeaking(text, Math.max(secs, 45), task, supported && secs > 0 ? "voice" : "typed");
            const avg = fb.scores.reduce((a, b) => a + b.band, 0) / fb.scores.length;
            const s = Math.round(156 + avg * 8);
            done(s, Math.round(avg * 4), 20);
            setResult(s);
          }}
        >
          Submit
        </Button>
      </Card>
    </SectionShell>
  );
}
