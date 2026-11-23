"use client";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Attempt, Question, Skill } from "@/domain/types";
import { useVerba } from "@/store/verba";
import { QuestionCard } from "./QuestionCard";
import { Button, Card, ProgressBar, Badge, cx } from "@/components/ui/primitives";
import { TOPIC_LABEL } from "@/engine/levels";
import { minutesSince, now, todayISO } from "@/lib/dates";

export interface QuizResult {
  correct: number;
  total: number;
  score: number;
  minutes: number;
  wrong: { q: Question; answer: string }[];
}

/**
 * Runs a sequence of questions with immediate feedback, records every attempt
 * (feeding the adaptive engine and My Mistakes) and logs a study session.
 */
export function QuizRunner({
  questions,
  source,
  title,
  skill,
  activity,
  onFinish,
  onRestart,
  mode = "learning",
  summaryExtra,
  log = true,
  planBlock,
}: {
  questions: Question[];
  source: Attempt["source"];
  title: string;
  skill?: Skill;
  activity: "lesson" | "use-of-english" | "reading" | "listening" | "vocabulary" | "mistakes" | "mock";
  onFinish?: (r: QuizResult) => void;
  onRestart?: () => void;
  mode?: "learning" | "exam";
  summaryExtra?: React.ReactNode;
  log?: boolean;
  /** Study-plan block to mark as done when the set is finished. */
  planBlock?: string;
}) {
  const recordAnswer = useVerba((s) => s.recordAnswer);
  const logSession = useVerba((s) => s.logSession);
  const markBlock = useVerba((s) => s.markBlock);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<{ q: Question; answer: string; correct: boolean }[]>([]);
  const [finished, setFinished] = useState<QuizResult | null>(null);
  const [started] = useState(now);

  function finish(all: typeof answers) {
    const correct = all.filter((a) => a.correct).length;
    const minutes = minutesSince(started);
    const r: QuizResult = { correct, total: all.length, score: Math.round((correct / Math.max(1, all.length)) * 100), minutes, wrong: all.filter((a) => !a.correct) };
    if (log) logSession({ minutes, activity, skill, title, score: r.score });
    if (planBlock) markBlock(todayISO(), planBlock, "done");
    setFinished(r);
    onFinish?.(r);
  }

  function answered(correct: boolean, answer: string) {
    const q = questions[i];
    recordAnswer(q, answer, correct, source);
    const next = [...answers, { q, answer, correct }];
    setAnswers(next);
    if (mode === "exam") {
      if (i + 1 >= questions.length) finish(next);
      else setI(i + 1);
    }
  }

  function next() {
    if (i + 1 >= questions.length) finish(answers);
    else setI(i + 1);
  }

  if (!questions.length) return <p className="text-muted">No questions available for this selection.</p>;

  if (finished) {
    return (
      <div className="animate-rise">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="eyebrow mb-1">Result</div>
            <div className="font-display text-5xl text-ink tabular">{finished.score}%</div>
            <div className="mt-1 text-sm text-muted">
              {finished.correct} of {finished.total} correct · {finished.minutes} min
            </div>
          </div>
          <div className="flex-1 text-[14.5px] leading-relaxed text-ink-2">
            {finished.score >= 85
              ? "Excellent — this is C1-level control. The engine will push the difficulty up."
              : finished.score >= 65
                ? "Solid. The items you missed are now in My Mistakes and will be reviewed on a spaced schedule."
                : "This area needs work — which is exactly why it's in your plan. Review the explanations below, then retry tomorrow."}
          </div>
        </div>
        {summaryExtra}
        {finished.wrong.length > 0 && (
          <div className="mt-6">
            <div className="eyebrow mb-2">To review</div>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
              {finished.wrong.map(({ q, answer }) => (
                <li key={q.id} className="px-4 py-3 text-[14px]">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone="outline">{TOPIC_LABEL[q.topic]}</Badge>
                  </div>
                  <div className="text-ink-2">{q.original ? `${q.original} → ` : ""}{q.prompt}</div>
                  <div className="mt-1">
                    <span className="text-bad line-through decoration-1">{answer || "—"}</span> <span className="mx-1 text-faint">→</span> <span className="font-medium text-ok">{q.answers[0]}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {onRestart && (
          <div className="mt-6">
            <Button variant="secondary" onClick={onRestart}>
              <RotateCcw size={15} /> New set
            </Button>
          </div>
        )}
      </div>
    );
  }

  const q = questions[i];
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <ProgressBar value={i + (answers.length > i ? 1 : 0)} max={questions.length} className="flex-1" label="Progress" />
        <div className="flex gap-1" aria-hidden>
          {answers.slice(-12).map((a, k) => (
            <span key={k} className={cx("h-1.5 w-1.5 rounded-full", a.correct ? "bg-ok" : "bg-bad")} />
          ))}
        </div>
      </div>
      <QuestionCard key={q.id + i} q={q} index={i} total={questions.length} mode={mode} onAnswered={answered} onNext={next} nextLabel={i + 1 >= questions.length ? "See results" : "Next question"} />
    </div>
  );
}

export function QuizCard(props: React.ComponentProps<typeof QuizRunner>) {
  return (
    <Card className="p-5 sm:p-7">
      <QuizRunner {...props} />
    </Card>
  );
}
