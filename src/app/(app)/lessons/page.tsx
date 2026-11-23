"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Languages, Lightbulb, ListChecks, Sparkles } from "lucide-react";
import type { Lesson, Skill } from "@/domain/types";
import { LESSONS } from "@/data";
import { useVerba, snapshot } from "@/store/verba";
import { recommendLesson } from "@/engine/planner";
import { SKILL_LABEL, TOPIC_LABEL } from "@/engine/levels";
import { Badge, Button, ButtonLink, Card, Chip, PageHeader, ProgressBar, Rich, cx } from "@/components/ui/primitives";
import { QuizRunner, type QuizResult } from "@/components/exercise/QuizRunner";
import { useSpanishDefault } from "@/components/exercise/QuestionCard";
import { minutesSince, now, todayISO } from "@/lib/dates";

export default function LessonsPage() {
  return (
    <Suspense>
      <Lessons />
    </Suspense>
  );
}

function Lessons() {
  const params = useSearchParams();
  const id = params.get("id");
  const lesson = LESSONS.find((l) => l.id === id);
  if (lesson) return <LessonPlayer key={lesson.id} lesson={lesson} />;
  return <LessonLibrary />;
}

function LessonLibrary() {
  const done = useVerba((s) => s.lessonsDone);
  const levels = useVerba((s) => s.levels);
  const [skill, setSkill] = useState<Skill | "all">("all");
  const rec = useMemo(() => recommendLesson(snapshot()), [done, levels]); // eslint-disable-line react-hooks/exhaustive-deps
  const skills = [...new Set(LESSONS.map((l) => l.skill))];
  const list = LESSONS.filter((l) => skill === "all" || l.skill === skill);
  const completed = Object.keys(done).length;

  return (
    <div>
      <PageHeader eyebrow="Daily lessons" title="Short lessons, real progress" subtitle="Each lesson has one objective, a short explanation, examples, guided practice with feedback, vocabulary notes and a final mini-test." action={<Badge tone="outline" className="px-3 py-1 text-[13px]">{completed} / {LESSONS.length} completed</Badge>} />

      <Card className="mb-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-card">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <div className="eyebrow mb-1">Recommended for you today</div>
          <div className="font-display text-xl text-ink">{rec.lesson.title}</div>
          <p className="mt-1 text-[14px] text-ink-2">{rec.reason}</p>
        </div>
        <ButtonLink href={`/lessons?id=${rec.lesson.id}`} size="lg">
          Start <ArrowRight size={16} />
        </ButtonLink>
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        <Chip active={skill === "all"} onClick={() => setSkill("all")}>
          All
        </Chip>
        {skills.map((s) => (
          <Chip key={s} active={skill === s} onClick={() => setSkill(s)}>
            {SKILL_LABEL[s]}
          </Chip>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((l) => {
          const d = done[l.id];
          return (
            <Link key={l.id} href={`/lessons?id=${l.id}`} className="group">
              <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <Badge tone="accent">{SKILL_LABEL[l.skill]}</Badge>
                  <Badge tone="neutral">{l.level}</Badge>
                  {d && (
                    <Badge tone="ok">
                      <Check size={11} /> {d.best}%
                    </Badge>
                  )}
                </div>
                <h3 className="text-[17px] font-medium leading-snug text-ink">{l.title}</h3>
                <p className="mt-1.5 line-clamp-2 flex-1 text-[13.5px] text-muted">{l.objective}</p>
                <div className="mt-4 flex items-center justify-between text-[12px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} /> {l.minutes} min
                  </span>
                  <span>{TOPIC_LABEL[l.topic]}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type Step = "learn" | "examples" | "practice" | "vocab" | "test" | "done";
const STEPS: { key: Step; label: string }[] = [
  { key: "learn", label: "Learn" },
  { key: "examples", label: "Examples" },
  { key: "practice", label: "Practice" },
  { key: "vocab", label: "Vocabulary" },
  { key: "test", label: "Mini-test" },
  { key: "done", label: "Results" },
];

function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("learn");
  const [practice, setPractice] = useState<QuizResult | null>(null);
  const [test, setTest] = useState<QuizResult | null>(null);
  const spanishDefault = useSpanishDefault();
  const [es, setEs] = useState(spanishDefault);
  const [started] = useState(now);
  const completeLesson = useVerba((s) => s.completeLesson);
  const logSession = useVerba((s) => s.logSession);
  const markBlock = useVerba((s) => s.markBlock);
  const prev = useVerba((s) => s.lessonsDone[lesson.id]);
  const idx = STEPS.findIndex((s) => s.key === step);

  function finishTest(r: QuizResult) {
    setTest(r);
    const total = (practice?.total ?? 0) + r.total;
    const correct = (practice?.correct ?? 0) + r.correct;
    // the mini-test counts double: it's the "can you do it without help" check
    const score = Math.round(((correct + r.correct) / Math.max(1, total + r.total)) * 100);
    completeLesson(lesson.id, score);
    logSession({ minutes: minutesSince(started), activity: "lesson", skill: lesson.skill, title: lesson.title, score });
    markBlock(todayISO(), `lesson:${lesson.id}`, "done");
    setStep("done");
  }

  const finalScore = test ? Math.round((((practice?.correct ?? 0) + test.correct * 2) / Math.max(1, (practice?.total ?? 0) + test.total * 2)) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => router.push("/lessons")} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={15} /> All lessons
      </button>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="accent">{SKILL_LABEL[lesson.skill]}</Badge>
        <Badge tone="neutral">{lesson.level}</Badge>
        <Badge tone="outline">
          <Clock size={11} /> {lesson.minutes} min
        </Badge>
        {prev && <Badge tone="ok">Previous best {prev.best}%</Badge>}
      </div>
      <h1 className="text-[1.9rem] font-medium leading-tight text-ink sm:text-[2.3rem]">{lesson.title}</h1>

      {/* Stepper */}
      <ol className="no-scrollbar my-6 flex gap-1.5 overflow-x-auto">
        {STEPS.map((s, i) => (
          <li key={s.key} className="min-w-[72px] flex-1">
            <div className={cx("h-1 rounded-full", i < idx ? "bg-accent" : i === idx ? "bg-accent/60" : "bg-sand")} />
            <div className={cx("mt-1.5 text-[11.5px]", i === idx ? "font-medium text-ink" : "text-faint")}>{s.label}</div>
          </li>
        ))}
      </ol>

      <Card className="p-6 sm:p-8">
        {step === "learn" && (
          <div className="animate-rise">
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-accent-50/70 p-4">
              <Lightbulb size={18} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <div className="eyebrow mb-0.5">Objective</div>
                <p className="text-[15px] text-ink">{lesson.objective}</p>
              </div>
            </div>
            <div className="space-y-4 text-[15.5px] leading-relaxed text-ink-2">
              {lesson.explanation.map((p, i) => (
                <p key={i}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
            {lesson.explanationEs && (
              <div className="mt-5">
                {es ? (
                  <div className="rounded-2xl border border-line bg-paper p-4 text-[14.5px] leading-relaxed text-ink-2">
                    <div className="eyebrow mb-1">En español</div>
                    <Rich text={lesson.explanationEs} />
                  </div>
                ) : (
                  <button onClick={() => setEs(true)} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
                    <Languages size={14} /> Ver resumen en español
                  </button>
                )}
              </div>
            )}
            <div className="mt-7 flex justify-end">
              <Button onClick={() => setStep("examples")}>
                See examples <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === "examples" && (
          <div className="animate-rise">
            <div className="eyebrow mb-4">Examples</div>
            <ul className="space-y-3">
              {lesson.examples.map((e, i) => (
                <li key={i} className="rounded-2xl border border-line/80 bg-paper p-4">
                  <p className="font-display text-[17px] leading-relaxed text-ink">
                    <Rich text={e.sentence} />
                  </p>
                  {e.note && <p className="mt-1 text-[13.5px] text-muted">{e.note}</p>}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex justify-between">
              <Button variant="ghost" onClick={() => setStep("learn")}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button onClick={() => setStep("practice")}>
                Practise <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === "practice" && (
          <div>
            <div className="eyebrow mb-4 flex items-center gap-1.5">
              <ListChecks size={13} /> Guided practice — feedback after each answer
            </div>
            {practice ? (
              <div className="animate-rise">
                <p className="text-[15px] text-ink-2">
                  Practice done: <strong className="text-ink">{practice.correct}/{practice.total}</strong>. Before the mini-test, a few words worth keeping from this lesson’s topic.
                </p>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setStep("vocab")}>
                    Vocabulary notes <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            ) : (
              <QuizRunner questions={lesson.practice} source="lesson" title={lesson.title} skill={lesson.skill} activity="lesson" log={false} onFinish={setPractice} />
            )}
          </div>
        )}

        {step === "vocab" && (
          <div className="animate-rise">
            <div className="eyebrow mb-4 flex items-center gap-1.5">
              <BookOpen size={13} /> Vocabulary notes
            </div>
            <ul className="divide-y divide-line">
              {lesson.vocabulary.map((v) => (
                <li key={v.term} className="py-3.5">
                  <div className="font-display text-[17px] text-ink">{v.term}</div>
                  <div className="text-[14px] text-ink-2">{v.meaning}</div>
                  <div className="mt-1 text-[13.5px] italic text-muted">“{v.example}”</div>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex justify-end">
              <Button onClick={() => setStep("test")}>
                Take the mini-test <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === "test" && (
          <div>
            <div className="eyebrow mb-4">Mini-test — new items, same skill</div>
            <QuizRunner questions={lesson.test} source="lesson" title={lesson.title} skill={lesson.skill} activity="lesson" log={false} onFinish={finishTest} />
          </div>
        )}

        {step === "done" && test && (
          <div className="animate-rise text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ok-50 text-ok">
              <Check size={26} />
            </div>
            <div className="eyebrow mb-1">Lesson complete</div>
            <div className="font-display text-5xl text-ink tabular">{finalScore}%</div>
            <p className="mx-auto mt-2 max-w-md text-[14.5px] text-ink-2">
              Practice {practice?.correct}/{practice?.total} · Mini-test {test.correct}/{test.total}.{" "}
              {finalScore >= 80 ? "Strong result — this topic will now appear mostly as review." : "Your mistakes are saved and scheduled. The planner will bring this topic back soon."}
            </p>
            <ProgressBar value={finalScore} className="mx-auto mt-5 max-w-sm" tone={finalScore >= 80 ? "ok" : "accent"} label="Lesson score" />
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/">Back to dashboard</ButtonLink>
              <ButtonLink href={`/use-of-english?topic=${lesson.topic}`} variant="secondary">
                More practice on {TOPIC_LABEL[lesson.topic].toLowerCase()}
              </ButtonLink>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
