"use client";
import { useEffect, useRef, useState } from "react";
import { Check, X, Languages, KeyRound } from "lucide-react";
import type { Question } from "@/domain/types";
import { checkAnswer, type CheckResult } from "@/engine/check";
import { TOPIC_LABEL } from "@/engine/levels";
import { overallScore } from "@/engine/adaptive";
import { useVerba } from "@/store/verba";
import { Badge, Button, Rich, cx } from "@/components/ui/primitives";

export function useSpanishDefault(): boolean {
  const pref = useVerba((s) => s.profile?.spanishSupport ?? "auto");
  const levels = useVerba((s) => s.levels);
  if (pref === "more") return true;
  if (pref === "off" || pref === "less") return false;
  return overallScore(levels) < 177; // gradually move to English immersion as the level rises
}

function GapPrompt({ prompt, children }: { prompt: string; children: React.ReactNode }) {
  const [a, b] = prompt.split("____");
  return (
    <p className="text-[17px] leading-[1.9] text-ink">
      {a}
      {children}
      {b}
    </p>
  );
}

export interface QuestionCardProps {
  q: Question;
  index?: number;
  total?: number;
  /** "learning" shows feedback immediately; "exam" just records the answer. */
  mode?: "learning" | "exam";
  onAnswered: (correct: boolean, answer: string) => void;
  onNext?: () => void;
  nextLabel?: string;
  showMeta?: boolean;
}

export function QuestionCard({ q, index, total, mode = "learning", onAnswered, onNext, nextLabel = "Next", showMeta = true }: QuestionCardProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const spanishDefault = useSpanishDefault();
  const [showEs, setShowEs] = useState(spanishDefault);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Parents key this component by question id, so state resets on each new item.
  useEffect(() => {
    if (q.kind !== "mcq") inputRef.current?.focus();
  }, [q.kind]);

  useEffect(() => {
    if (result) nextRef.current?.focus();
  }, [result]);

  function submit(value = answer) {
    if (result || !value.trim()) return;
    const r = checkAnswer(q, value);
    if (mode === "exam") {
      onAnswered(r.correct, value);
      return;
    }
    setResult(r);
    onAnswered(r.correct, value);
  }

  const done = result !== null;
  const gapInput = (
    <input
      ref={inputRef}
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && (done ? onNext?.() : submit())}
      disabled={done}
      aria-label="Your answer"
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      className={cx(
        "mx-1 inline-block rounded-lg border-b-2 bg-paper px-2 py-0.5 text-center font-medium outline-none transition-colors",
        q.kind === "transform" ? "w-full max-w-[22rem]" : "w-40",
        done ? (result?.correct ? "border-ok bg-ok-50 text-ok" : "border-bad bg-bad-50 text-bad") : "border-accent/60 focus:border-accent",
      )}
    />
  );

  return (
    <div className="animate-rise">
      {showMeta && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {index !== undefined && total !== undefined && (
            <span className="tabular text-[12px] font-medium text-muted">
              {index + 1} / {total}
            </span>
          )}
          <Badge tone="outline">{TOPIC_LABEL[q.topic]}</Badge>
          <Badge tone="neutral">{q.level}</Badge>
          {q.part && <Badge tone="accent">{q.part.replace(/-/g, " ")}</Badge>}
        </div>
      )}

      {q.kind === "transform" && q.original && (
        <div className="mb-4 rounded-2xl bg-sand/60 p-4">
          <p className="text-[16px] leading-relaxed text-ink">{q.original}</p>
          {q.keyword && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-1 text-[13px] font-semibold tracking-[0.12em] text-card">
              <KeyRound size={13} /> {q.keyword}
            </div>
          )}
        </div>
      )}

      {q.kind === "mcq" ? (
        <>
          <p className="mb-5 text-[17px] leading-[1.8] text-ink">
            {q.prompt.includes("____") ? (
              <>
                {q.prompt.split("____")[0]}
                <span className={cx("mx-1 inline-block min-w-16 border-b-2 px-1 text-center font-medium", done ? (result?.correct ? "border-ok text-ok" : "border-bad text-bad") : "border-line-2 text-transparent")}>{done ? answer : "·"}</span>
                {q.prompt.split("____")[1]}
              </>
            ) : (
              q.prompt
            )}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options!.map((o, i) => {
              const isAnswer = o === q.answers[0];
              const chosen = o === answer;
              return (
                <button
                  key={o}
                  disabled={done}
                  onClick={() => {
                    setAnswer(o);
                    submit(o);
                  }}
                  className={cx(
                    "flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition-all",
                    !done && "border-line bg-paper hover:-translate-y-px hover:border-accent/60 hover:shadow-sm",
                    done && isAnswer && "border-ok bg-ok-50 text-ink",
                    done && chosen && !isAnswer && "border-bad bg-bad-50 text-ink",
                    done && !isAnswer && !chosen && "border-line bg-paper opacity-60",
                  )}
                >
                  <span className={cx("mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold", done && isAnswer ? "bg-ok text-card" : done && chosen ? "bg-bad text-card" : "bg-sand text-ink-2")}>
                    {done && isAnswer ? <Check size={13} /> : done && chosen ? <X size={13} /> : String.fromCharCode(65 + i)}
                  </span>
                  <span>{o}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {q.stem && (
            <div className="mb-3 text-[13px] text-muted">
              Use the word in capitals to form a word that fits the gap: <span className="ml-1 rounded-md bg-ink px-2 py-0.5 font-semibold tracking-[0.12em] text-card">{q.stem}</span>
            </div>
          )}
          <GapPrompt prompt={q.prompt}>{gapInput}</GapPrompt>
          {q.kind === "transform" && <p className="mt-2 text-xs text-muted">Write 3–6 words, including the key word unchanged.</p>}
          {!done && (
            <div className="mt-5">
              <Button onClick={() => submit()} disabled={!answer.trim()}>
                Check answer
              </Button>
            </div>
          )}
        </>
      )}

      {done && result && (
        <div className={cx("animate-rise mt-6 rounded-2xl border p-5", result.correct ? "border-ok/30 bg-ok-50/60" : "border-bad/25 bg-bad-50/50")} role="status" aria-live="polite">
          <div className="mb-2 flex items-center gap-2">
            <span className={cx("grid h-6 w-6 place-items-center rounded-full text-card", result.correct ? "bg-ok" : "bg-bad")}>{result.correct ? <Check size={14} /> : <X size={14} />}</span>
            <span className="font-display text-[17px] text-ink">{result.correct ? "Correct" : "Not quite"}</span>
            {!result.correct && q.kind !== "mcq" && (
              <span className="text-[14px] text-ink-2">
                — answer: <strong className="text-ink">{q.answers[0]}</strong>
                {q.answers.length > 1 && <span className="text-muted"> (also: {q.answers.slice(1, 3).join(" / ")})</span>}
              </span>
            )}
          </div>
          {result.warning && <p className="mb-2 text-[13.5px] text-bad">{result.warning}</p>}
          <p className="text-[14.5px] leading-relaxed text-ink-2">
            <Rich text={q.explanation} />
          </p>
          {!result.correct && q.optionNotes && q.optionNotes[answer] && (
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
              <span className="font-medium text-bad">Why not “{answer}”?</span> {q.optionNotes[answer]}
            </p>
          )}
          {q.optionNotes && (
            <details className="mt-2 text-[13.5px] text-muted">
              <summary className="cursor-pointer select-none hover:text-ink">Other options explained</summary>
              <ul className="mt-2 space-y-1">
                {Object.entries(q.optionNotes).map(([k, v]) => (
                  <li key={k}>
                    <strong className="text-ink-2">{k}</strong> — {v}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {q.explanationEs && (
            <div className="mt-3">
              {showEs ? (
                <p className="rounded-xl bg-card/70 px-3 py-2 text-[13.5px] italic text-ink-2">🇪🇸 {q.explanationEs}</p>
              ) : (
                <button onClick={() => setShowEs(true)} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
                  <Languages size={14} /> Ver explicación en español
                </button>
              )}
            </div>
          )}
          {!result.correct && <p className="mt-3 text-[12.5px] text-muted">Saved to My Mistakes — it will come back for review.</p>}
          {onNext && (
            <div className="mt-4">
              <Button ref={nextRef} onClick={onNext}>
                {nextLabel}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
