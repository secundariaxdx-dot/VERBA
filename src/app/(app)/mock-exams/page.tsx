"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, Clock, FileCheck2, Flag, Info, Timer } from "lucide-react";
import type { ListeningTrack, MockResult, Question, ReadingText, Topic, WritingTask } from "@/domain/types";
import { LISTENING, READING, USE_OF_ENGLISH, WRITING_TASKS } from "@/data";
import { useVerba } from "@/store/verba";
import { evaluateWriting } from "@/engine/writingEval";
import { C1_THRESHOLD, TOPIC_LABEL, bandFor, gradeFor, percentToScale } from "@/engine/levels";
import { QuestionCard } from "@/components/exercise/QuestionCard";
import { ListeningPlayer } from "@/components/skills/ListeningPlayer";
import { Badge, Button, ButtonLink, Card, CardHeader, PageHeader, ProgressBar, Segmented, cx } from "@/components/ui/primitives";
import { formatShort, todayISO, uid } from "@/lib/dates";
import { wordCount } from "@/lib/text";

type Paper = "reading-uoe" | "listening" | "writing";

interface ExamDef {
  id: string;
  title: string;
  papers: Paper[];
  minutes: number;
  description: string;
}

const EXAMS: ExamDef[] = [
  { id: "full-a", title: "Full mock A", papers: ["reading-uoe", "listening", "writing"], minutes: 95, description: "Reading & Use of English, Listening and Writing in one sitting (shortened paper)." },
  { id: "full-b", title: "Full mock B", papers: ["reading-uoe", "listening", "writing"], minutes: 95, description: "A second full mock with different items." },
  { id: "paper-ruoe", title: "Reading & Use of English", papers: ["reading-uoe"], minutes: 45, description: "All four Use of English parts plus a reading text." },
  { id: "paper-listening", title: "Listening", papers: ["listening"], minutes: 20, description: "Two recordings, each heard twice." },
  { id: "paper-writing", title: "Writing", papers: ["writing"], minutes: 45, description: "One Part 1-style essay under time." },
];

interface Section {
  paper: Paper;
  title: string;
  questions: Question[];
  reading?: ReadingText;
  track?: ListeningTrack;
  writing?: WritingTask;
}

function pick<T>(arr: T[], seed: number, n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < arr.length && out.length < n; i++) out.push(arr[(seed + i * 3) % arr.length]);
  return [...new Set(out)];
}

function buildExam(def: ExamDef): Section[] {
  const seed = def.id.endsWith("b") ? 1 : 0;
  const sections: Section[] = [];
  if (def.papers.includes("reading-uoe")) {
    const part = (p: string, n: number) => pick(USE_OF_ENGLISH.filter((q) => q.part === p && ["B2+", "C1", "C1+"].includes(q.level)), seed * 5, n);
    sections.push({ paper: "reading-uoe", title: "Use of English · Part 1", questions: part("multiple-choice-cloze", 5) });
    sections.push({ paper: "reading-uoe", title: "Use of English · Part 2", questions: part("open-cloze", 5) });
    sections.push({ paper: "reading-uoe", title: "Use of English · Part 3", questions: part("word-formation", 5) });
    sections.push({ paper: "reading-uoe", title: "Use of English · Part 4", questions: part("key-word-transformation", 4) });
    const texts = READING.filter((t) => t.level === "C1" || t.level === "C1+");
    const text = texts[seed % texts.length];
    sections.push({ paper: "reading-uoe", title: "Reading", questions: text.questions, reading: text });
  }
  if (def.papers.includes("listening")) {
    const tracks = LISTENING.filter((t) => t.level !== "B2");
    pick(tracks, seed * 2, 2).forEach((t, i) => sections.push({ paper: "listening", title: `Listening · Part ${i + 1}`, questions: t.questions, track: t }));
  }
  if (def.papers.includes("writing")) {
    const essays = WRITING_TASKS.filter((t) => t.genre === "essay");
    sections.push({ paper: "writing", title: "Writing · Part 1", questions: [], writing: essays[seed % essays.length] });
  }
  return sections;
}

export default function MockExams() {
  const mocks = useVerba((s) => s.mocks);
  const [running, setRunning] = useState<{ def: ExamDef; mode: "exam" | "learning" } | null>(null);
  const [mode, setMode] = useState<"exam" | "learning">("exam");
  const [report, setReport] = useState<{ result: MockResult; wrongTopics: Topic[]; skills: Record<string, number> } | null>(null);

  if (running) return <Runner def={running.def} mode={running.mode} onDone={(r) => { setRunning(null); setReport(r); }} onQuit={() => setRunning(null)} />;
  if (report) return <Report {...report} onBack={() => setReport(null)} />;

  return (
    <div>
      <PageHeader eyebrow="Mock exams" title="Rehearse exam day" subtitle="Original exam-style content in shortened papers. Exam mode is timed with no feedback; learning mode explains each answer. Results are unofficial estimates — not Cambridge scores." action={<Segmented value={mode} onChange={setMode} options={[{ value: "exam", label: "Exam mode" }, { value: "learning", label: "Learning mode" }]} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {EXAMS.map((e) => (
            <Card key={e.id} className="flex flex-col p-5">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge tone={e.papers.length > 1 ? "accent" : "neutral"}>{e.papers.length > 1 ? "Full mock" : "Single paper"}</Badge>
                <Badge tone="outline">
                  <Clock size={11} /> {e.minutes} min
                </Badge>
              </div>
              <h3 className="text-[17px] font-medium text-ink">{e.title}</h3>
              <p className="mt-1.5 flex-1 text-[13.5px] text-muted">{e.description}</p>
              <Button className="mt-4 self-start" onClick={() => setRunning({ def: e, mode })}>
                <FileCheck2 size={15} /> Start {mode === "exam" ? "timed" : "learning"}
              </Button>
            </Card>
          ))}
          <Card className="flex flex-col justify-center p-5 text-[13.5px] text-ink-2">
            <div className="mb-2 flex items-center gap-2 font-medium text-ink">
              <Info size={15} className="text-accent" /> Speaking
            </div>
            The Speaking paper is practised in the Speaking trainer. Mock reports use your latest speaking estimate and say so.
            <ButtonLink href="/speaking" variant="secondary" size="sm" className="mt-3 self-start">
              Speaking trainer
            </ButtonLink>
          </Card>
        </div>
        <Card className="h-fit p-6">
          <CardHeader eyebrow="Results" title={mocks.length ? `${mocks.length} mock${mocks.length > 1 ? "s" : ""} taken` : "No mocks yet"} />
          {mocks.length === 0 ? (
            <p className="text-[13.5px] text-muted">Your results and readiness estimate will appear here.</p>
          ) : (
            <ul className="space-y-2.5">
              {[...mocks].reverse().map((m) => (
                <li key={m.id} className="rounded-xl bg-paper px-3.5 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-medium text-ink">{EXAMS.find((e) => e.id === m.examId)?.title ?? "Mini mock"}</span>
                    <Badge tone={m.overallScale >= C1_THRESHOLD ? "ok" : "accent"}>{m.overallScale}</Badge>
                  </div>
                  <div className="text-[12px] text-muted">
                    {formatShort(m.date.slice(0, 10))} · {m.mode} mode · {m.papers.map((p) => `${p.paper.replace("reading-uoe", "R&UoE")} ${p.scale}`).join(" · ")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Runner({ def, mode, onDone, onQuit }: { def: ExamDef; mode: "exam" | "learning"; onDone: (r: { result: MockResult; wrongTopics: Topic[]; skills: Record<string, number> }) => void; onQuit: () => void }) {
  const sections = useMemo(() => buildExam(def), [def]);
  const recordAnswer = useVerba((s) => s.recordAnswer);
  const saveMock = useVerba((s) => s.saveMock);
  const logSession = useVerba((s) => s.logSession);
  const saveWriting = useVerba((s) => s.saveWriting);
  const speaking = useVerba((s) => s.levels.speaking.score);
  const markBlock = useVerba((s) => s.markBlock);
  const [si, setSi] = useState(0);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; correct: boolean; q: Question }>>({});
  // finish() can run in the same tick as the last answer, so read answers from a ref
  const answersRef = useRef(answers);
  const [essay, setEssay] = useState("");
  const [left, setLeft] = useState(def.minutes * 60);
  const started = useRef(Date.now());
  const finished = useRef(false);
  const section = sections[si];
  const totalQ = sections.reduce((s, x) => s + x.questions.length, 0);

  useEffect(() => {
    if (mode !== "exam") return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [mode]);
  useEffect(() => {
    if (mode === "exam" && left <= 0) finish();
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  function answered(q: Question, correct: boolean, answer: string) {
    recordAnswer(q, answer, correct, "mock");
    answersRef.current = { ...answersRef.current, [q.id]: { answer, correct, q } };
    setAnswers(answersRef.current);
    if (mode === "exam") next();
  }

  function next() {
    if (qi + 1 < section.questions.length) setQi(qi + 1);
    else if (si + 1 < sections.length) {
      setSi(si + 1);
      setQi(0);
    } else finish();
  }

  function finish() {
    if (finished.current) return;
    finished.current = true;
    const answers = answersRef.current;
    const papers: MockResult["papers"] = [];
    const skills: Record<string, number> = {};
    const score = (pred: (q: Question) => boolean) => {
      const qs = sections.flatMap((s) => s.questions).filter(pred);
      const c = qs.filter((q) => answers[q.id]?.correct).length;
      return { c, t: qs.length };
    };
    if (def.papers.includes("reading-uoe")) {
      const r = score((q) => q.skill === "reading");
      const u = score((q) => q.skill === "useOfEnglish");
      const all = { c: r.c + u.c, t: r.t + u.t };
      papers.push({ paper: "reading-uoe", correct: all.c, total: all.t, scale: percentToScale((all.c / all.t) * 100) });
      skills.Reading = percentToScale((r.c / Math.max(1, r.t)) * 100);
      skills["Use of English"] = percentToScale((u.c / Math.max(1, u.t)) * 100);
    }
    if (def.papers.includes("listening")) {
      const l = score((q) => q.skill === "listening");
      papers.push({ paper: "listening", correct: l.c, total: l.t, scale: percentToScale((l.c / Math.max(1, l.t)) * 100) });
      skills.Listening = papers[papers.length - 1].scale;
    }
    if (def.papers.includes("writing")) {
      const task = sections.find((s) => s.writing)!.writing!;
      const fb = evaluateWriting(essay, task);
      const scale = wordCount(essay) < 40 ? 140 : fb.scaleScore;
      papers.push({ paper: "writing", correct: Math.round(fb.criteria.reduce((s, c) => s + c.band, 0)), total: 20, scale });
      skills.Writing = scale;
      if (essay.trim()) saveWriting({ id: uid("wr"), taskId: task.id, text: essay, wordCount: wordCount(essay), minutesSpent: 0, date: new Date().toISOString(), status: "submitted", feedback: fb });
    }
    if (def.papers.length > 1) skills["Speaking (from practice)"] = Math.round(speaking);
    const vals = Object.values(skills);
    const overall = Math.round(vals.reduce((s, x) => s + x, 0) / vals.length);
    const minutes = Math.max(1, Math.round((Date.now() - started.current) / 60000));
    const result: MockResult = { id: uid("mock"), examId: def.id, date: new Date().toISOString(), mode, papers, overallScale: overall, grade: gradeFor(overall), minutes };
    saveMock(result);
    logSession({ minutes, activity: "mock", title: `Mock: ${def.title}`, score: Math.round(((overall - 140) / 70) * 100) });
    markBlock(todayISO(), "exam", "done");
    const wrongTopics = Object.values(answers)
      .filter((a) => !a.correct)
      .map((a) => a.q.topic);
    // unanswered items count as wrong too
    for (const q of sections.flatMap((s) => s.questions)) if (!answers[q.id]) wrongTopics.push(q.topic);
    onDone({ result, wrongTopics, skills });
  }

  const answeredCount = Object.keys(answers).length;
  const mm = Math.floor(Math.max(0, left) / 60);
  const ss = String(Math.max(0, left) % 60).padStart(2, "0");
  const q = section.questions[qi];

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex items-center gap-4 border-b border-line/70 bg-cream/95 px-4 py-3 backdrop-blur lg:top-0">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-ink">
            {def.title} · {section.title}
          </div>
          <ProgressBar value={answeredCount + (essay ? 1 : 0)} max={totalQ + (def.papers.includes("writing") ? 1 : 0)} className="mt-1.5" />
        </div>
        {mode === "exam" && (
          <span className={cx("tabular inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-medium", left < 300 ? "bg-bad-50 text-bad" : "bg-sand text-ink")}>
            <Timer size={14} /> {mm}:{ss}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={() => (confirm("Finish now? Unanswered items count as incorrect.") ? finish() : undefined)}>
          <Flag size={14} /> Finish
        </Button>
        <Button variant="ghost" size="sm" onClick={() => confirm("Leave without saving this mock?") && onQuit()}>
          Quit
        </Button>
      </div>

      {section.writing ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card className="p-5">
            <textarea value={essay} onChange={(e) => setEssay(e.target.value)} className="min-h-[55vh] w-full rounded-2xl border border-line bg-paper p-5 font-display text-[16.5px] leading-relaxed focus:border-accent focus:outline-none" placeholder="Write your essay here (220–260 words)." aria-label="Essay" />
            <div className="mt-3 flex items-center justify-between">
              <span className="tabular text-[13.5px] text-muted">{wordCount(essay)} words</span>
              <Button onClick={finish}>
                Submit and see results <ArrowRight size={15} />
              </Button>
            </div>
          </Card>
          <Card className="h-fit p-5">
            <div className="eyebrow mb-2">Task</div>
            <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{section.writing.prompt}</p>
            <ul className="mt-3 space-y-1 text-[13px] text-ink-2">
              {section.writing.requirements.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <div className={cx("grid gap-6", (section.reading || section.track) && "lg:grid-cols-[1.1fr_1fr]")}>
          {section.reading && (
            <Card className="p-6 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto">
              <h2 className="mb-4 text-xl text-ink">{section.reading.title}</h2>
              <div className="prose-verba font-display text-[16px] text-ink-2">
                {section.reading.paragraphs.map((p, i) => (
                  <p key={i}>
                    <span className="mr-2 font-sans text-[11px] font-semibold text-faint">{i + 1}</span>
                    {p}
                  </p>
                ))}
              </div>
            </Card>
          )}
          {section.track && <ListeningPlayer key={section.track.id} track={section.track} mode={mode} showTranscript={false} />}
          <Card className="p-5 sm:p-7">
            {q && <QuestionCard key={q.id} q={q} index={qi} total={section.questions.length} mode={mode} onAnswered={(c, a) => answered(q, c, a)} onNext={next} nextLabel="Next" />}
          </Card>
        </div>
      )}
    </div>
  );
}

function Report({ result, wrongTopics, skills, onBack }: { result: MockResult; wrongTopics: Topic[]; skills: Record<string, number>; onBack: () => void }) {
  const counts = wrongTopics.reduce<Record<string, number>>((m, t) => ((m[t] = (m[t] ?? 0) + 1), m), {});
  const patterns = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) as [Topic, number][];
  const entries = Object.entries(skills);
  const strengths = entries.filter(([, v]) => v >= C1_THRESHOLD).map(([k]) => k);
  const weaknesses = entries.filter(([, v]) => v < 175).map(([k]) => k);
  const readiness = Math.max(0, Math.min(100, Math.round(((result.overallScale - 160) / 20) * 100)));
  const verdict = result.overallScale >= 185 ? "Ready" : result.overallScale >= 180 ? "Borderline pass" : result.overallScale >= 172 ? "Getting close" : "Not yet";
  return (
    <div>
      <PageHeader eyebrow="Mock exam report" title={`${result.overallScale} · ${bandFor(result.overallScale).label}`} subtitle={`${result.grade}. Completed in ${result.minutes} min (${result.mode} mode).`} action={<Button variant="secondary" onClick={onBack}>All mocks</Button>} />
      <div className="mb-6 flex items-start gap-2 rounded-2xl border border-gold/30 bg-gold-50/60 p-4 text-[13.5px] text-ink-2">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold" /> Unofficial estimate based on VERBA’s shortened papers and original items. Official Cambridge results come only from the real exam.
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <CardHeader eyebrow="C1 readiness (est.)" title={verdict} />
          <ProgressBar value={readiness} tone={readiness >= 100 ? "ok" : "accent"} />
          <p className="mt-2 text-[13px] text-muted">{readiness}% of the way from B2 (160) to the C1 threshold (180).</p>
          <div className="mt-5 space-y-2">
            {result.papers.map((p) => (
              <div key={p.paper} className="flex justify-between text-[13.5px]">
                <span className="text-ink-2">{p.paper === "reading-uoe" ? "Reading & Use of English" : p.paper === "listening" ? "Listening" : "Writing"}</span>
                <span className="tabular text-ink">
                  {p.paper !== "writing" && `${p.correct}/${p.total} · `}
                  {p.scale}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Skill breakdown" />
          <ul className="space-y-3">
            {entries.map(([k, v]) => (
              <li key={k}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-ink-2">{k}</span>
                  <span className="tabular text-ink">
                    {v} · {bandFor(v).short}
                  </span>
                </div>
                <ProgressBar value={v - 150} max={50} tone={v >= C1_THRESHOLD ? "ok" : "accent"} />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Error patterns" />
          {patterns.length === 0 ? (
            <p className="text-[13.5px] text-muted">No errors — impressive.</p>
          ) : (
            <ul className="space-y-1.5 text-[13.5px]">
              {patterns.map(([t, n]) => (
                <li key={t} className="flex justify-between">
                  <span className="text-ink-2">{TOPIC_LABEL[t]}</span>
                  <span className="tabular text-bad">{n} wrong</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <CardHeader eyebrow="Strengths & weaknesses" />
          <p className="text-[14px] text-ink-2">
            <strong className="text-ok">Strengths:</strong> {strengths.length ? strengths.join(", ") : "none at C1 yet in this mock — keep going."}
          </p>
          <p className="mt-2 text-[14px] text-ink-2">
            <strong className="text-bad">Needs work:</strong> {weaknesses.length ? weaknesses.join(", ") : "no paper below B2+."}
          </p>
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Recommended next steps" />
          <ul className="space-y-1.5 text-[14px] text-ink-2">
            {patterns.slice(0, 2).map(([t]) => (
              <li key={t}>• Targeted practice on {TOPIC_LABEL[t].toLowerCase()} (already added to your plan via My Mistakes).</li>
            ))}
            {weaknesses.includes("Writing") && <li>• One full writing task this week; apply the feedback in a rewrite.</li>}
            {weaknesses.includes("Listening") && <li>• Two recordings in learning mode at 0.9×, then one in exam mode.</li>}
            <li>• Next mock in about a week, to measure the change.</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <ButtonLink href="/mistakes?mode=practice" size="sm">
              Review mistakes
            </ButtonLink>
            <ButtonLink href="/plan" size="sm" variant="secondary">
              Study plan
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}

