"use client";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, FileText, Lightbulb, Loader2, PenLine, Sparkles, Trash2, TrendingUp } from "lucide-react";
import type { WritingFeedback, WritingSubmission, WritingTask } from "@/domain/types";
import { WRITING_TASKS } from "@/data";
import { useVerba } from "@/store/verba";
import { evaluateWriting } from "@/engine/writingEval";
import { aiAvailable, aiWritingFeedback } from "@/services/ai";
import { Badge, Button, Card, CardHeader, PageHeader, ProgressBar, cx } from "@/components/ui/primitives";
import { LineChart } from "@/components/charts/Charts";
import { wordCount } from "@/lib/text";
import { formatShort, todayISO, uid } from "@/lib/dates";
import { gradeFor } from "@/engine/levels";

export default function Page() {
  return (
    <Suspense>
      <Writing />
    </Suspense>
  );
}

function Writing() {
  const params = useSearchParams();
  const task = WRITING_TASKS.find((t) => t.id === params.get("id"));
  const sub = params.get("sub");
  if (task) return <Editor key={params.toString()} task={task} subId={sub} />;
  return <WritingHome />;
}

function WritingHome() {
  const writing = useVerba((s) => s.writing);
  const deleteWriting = useVerba((s) => s.deleteWriting);
  const submitted = [...writing].filter((w) => w.feedback).sort((a, b) => a.date.localeCompare(b.date));
  const drafts = writing.filter((w) => w.status === "draft");
  const genres = [...new Set(WRITING_TASKS.map((t) => t.genre))];

  return (
    <div>
      <PageHeader eyebrow="Writing" title="C1 Writing trainer" subtitle="Exam-style tasks with a timer and word target. Feedback follows the four Cambridge criteria and teaches you what to change — it doesn’t just rewrite your text." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {drafts.length > 0 && (
            <Card className="p-5">
              <CardHeader eyebrow="Drafts in progress" />
              <ul className="space-y-2">
                {drafts.map((d) => {
                  const t = WRITING_TASKS.find((x) => x.id === d.taskId);
                  return (
                    <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3.5 py-2.5">
                      <Link href={`/writing?id=${d.taskId}&sub=${d.id}`} className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">{t?.title}</span>
                        <span className="text-[12px] text-muted">
                          {d.wordCount} words · saved {formatShort(d.date.slice(0, 10))}
                        </span>
                      </Link>
                      <button onClick={() => deleteWriting(d.id)} className="text-faint hover:text-bad" aria-label="Delete draft">
                        <Trash2 size={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
          {genres.map((g) => (
            <div key={g}>
              <div className="eyebrow mb-2.5">{g}s</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {WRITING_TASKS.filter((t) => t.genre === g).map((t) => {
                  const best = Math.max(0, ...submitted.filter((s) => s.taskId === t.id).map((s) => s.feedback!.scaleScore));
                  return (
                    <Link key={t.id} href={`/writing?id=${t.id}`} className="group">
                      <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <Badge tone="accent">{t.genre}</Badge>
                          <Badge tone="outline">{t.register}</Badge>
                          {best > 0 && <Badge tone="ok">Best {best}</Badge>}
                        </div>
                        <h3 className="text-[16.5px] font-medium leading-snug text-ink">{t.title}</h3>
                        <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] text-muted">{t.prompt}</p>
                        <div className="mt-3 flex gap-3 text-[12px] text-faint">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> {t.minutes} min
                          </span>
                          <span>
                            {t.wordRange[0]}–{t.wordRange[1]} words
                          </span>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader eyebrow="Progress" title={submitted.length ? `${submitted.length} task${submitted.length > 1 ? "s" : ""} assessed` : "No submissions yet"} />
            {submitted.length >= 2 ? (
              <LineChart points={submitted.map((s) => ({ x: s.date.slice(0, 10), y: s.feedback!.scaleScore, label: formatShort(s.date.slice(0, 10)) }))} refLine={180} refLabel="C1" height={150} />
            ) : (
              <p className="text-[13.5px] text-muted">Submit two or more tasks to compare your writing over time.</p>
            )}
          </Card>
          <Card className="p-6">
            <CardHeader eyebrow="History" />
            {submitted.length === 0 ? (
              <p className="text-[13.5px] text-muted">Your assessed writing will appear here.</p>
            ) : (
              <ul className="space-y-2">
                {[...submitted].reverse().map((s) => {
                  const t = WRITING_TASKS.find((x) => x.id === s.taskId);
                  return (
                    <li key={s.id}>
                      <Link href={`/writing?id=${s.taskId}&sub=${s.id}`} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-sand/50">
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] text-ink">{t?.title}</span>
                          <span className="text-[11.5px] text-muted">
                            {formatShort(s.date.slice(0, 10))} · {s.wordCount} words
                          </span>
                        </span>
                        <Badge tone={s.feedback!.scaleScore >= 180 ? "ok" : "accent"}>{s.feedback!.estimatedLevel}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Editor({ task, subId }: { task: WritingTask; subId: string | null }) {
  const router = useRouter();
  const existing = useVerba((s) => (subId ? s.writing.find((w) => w.id === subId) : undefined));
  const writing = useVerba((s) => s.writing);
  const saveWriting = useVerba((s) => s.saveWriting);
  const logSession = useVerba((s) => s.logSession);
  const recordSkill = useVerba((s) => s.setSkillScore);
  const writingLevel = useVerba((s) => s.levels.writing);
  const markBlock = useVerba((s) => s.markBlock);

  const [id] = useState(existing?.id ?? uid("wr"));
  const [text, setText] = useState(existing?.text ?? "");
  const [feedback, setFeedback] = useState<WritingFeedback | undefined>(existing?.feedback);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(existing?.minutesSpent ? existing.minutesSpent * 60 : 0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const words = wordCount(text);
  const [minW, maxW] = task.wordRange;

  useEffect(() => {
    aiAvailable().then(setAi);
  }, []);

  useEffect(() => {
    if (feedback) return;
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [feedback]);

  // Autosave drafts
  useEffect(() => {
    if (feedback || !text.trim()) return;
    const t = setTimeout(() => {
      saveWriting({ id, taskId: task.id, text, wordCount: wordCount(text), minutesSpent: Math.round(elapsed / 60), date: new Date().toISOString(), status: "draft" });
      setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }, 900);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const previous = useMemo(() => writing.filter((w) => w.feedback && w.id !== id).sort((a, b) => b.date.localeCompare(a.date))[0], [writing, id]);

  async function submit() {
    setBusy(true);
    setAiError(null);
    let fb = evaluateWriting(text, task);
    if (ai) {
      try {
        fb = await aiWritingFeedback(task, text, fb);
      } catch (e) {
        setAiError(e instanceof Error ? e.message : "AI feedback unavailable — showing local analysis.");
      }
    }
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const sub: WritingSubmission = { id, taskId: task.id, text, wordCount: words, minutesSpent: minutes, date: new Date().toISOString(), status: "submitted", feedback: fb };
    saveWriting(sub);
    logSession({ minutes, activity: "writing", skill: "writing", title: `Writing: ${task.title}`, score: Math.round(((fb.scaleScore - 140) / 70) * 100) });
    // Blend the new evidence into the writing estimate (one task = strong evidence).
    const blended = Math.round((writingLevel.score * 0.6 + fb.scaleScore * 0.4) * 10) / 10;
    recordSkill("writing", blended);
    markBlock(todayISO(), "skill:writing", "done");
    setFeedback(fb);
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, "0");
  const over = mm >= task.minutes;

  return (
    <div>
      <button onClick={() => router.push("/writing")} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={15} /> All tasks
      </button>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {feedback ? (
            <FeedbackView fb={feedback} task={task} text={text} previous={previous?.feedback?.scaleScore} aiError={aiError} onRewrite={() => router.push(`/writing?id=${task.id}&new=${Date.now()}`)} />
          ) : (
            <Card className="p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{task.genre}</Badge>
                  <Badge tone="outline">{task.register} register</Badge>
                </div>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className={cx("tabular inline-flex items-center gap-1", over ? "text-bad" : "text-muted")}>
                    <Clock size={13} /> {mm}:{ss} / {task.minutes}:00
                  </span>
                  {savedAt && <span className="text-faint">Draft saved {savedAt}</span>}
                </div>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={task.genre === "letter" || task.genre === "email" ? "Dear …" : "Start writing here. Separate paragraphs with a blank line."}
                className="min-h-[52vh] w-full resize-y rounded-2xl border border-line bg-paper p-5 font-display text-[16.5px] leading-[1.75] text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                aria-label="Your answer"
                spellCheck
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-[200px] flex-1 items-center gap-3">
                  <span className={cx("tabular text-[13.5px] font-medium", words < minW ? "text-muted" : words > maxW + 20 ? "text-bad" : "text-ok")}>{words} words</span>
                  <ProgressBar value={words} max={maxW} className="max-w-[220px]" tone={words >= minW && words <= maxW + 20 ? "ok" : "accent"} label="Word count" />
                  <span className="text-[12px] text-faint">
                    target {minW}–{maxW}
                  </span>
                </div>
                <Button onClick={submit} disabled={busy || words < 60} size="lg">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {busy ? "Assessing…" : "Submit for feedback"}
                </Button>
              </div>
              <p className="mt-2 text-[12px] text-muted">{ai ? "Feedback by Claude (AI) plus VERBA’s own checks." : "Feedback by VERBA’s offline analyser. Add ANTHROPIC_API_KEY on the server for examiner-style AI feedback."}</p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="eyebrow mb-2">The task</div>
            <h2 className="text-[1.3rem] leading-snug text-ink">{task.title}</h2>
            <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{task.prompt}</p>
            <div className="mt-4 border-t border-line pt-4">
              <div className="eyebrow mb-2">Your answer must</div>
              <ul className="space-y-1.5 text-[13.5px] text-ink-2">
                {task.requirements.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex gap-4 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {task.minutes} min
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText size={13} /> {minW}–{maxW} words
              </span>
            </div>
          </Card>
          <Card className="p-5">
            <div className="eyebrow mb-2 flex items-center gap-1.5">
              <Lightbulb size={13} /> C1 language for this {task.genre}
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {task.usefulLanguage.map((u) => (
                <li key={u} className={cx("rounded-full px-2.5 py-1 text-[12.5px]", text.toLowerCase().includes(u.toLowerCase().replace(/[.…]+$/, "").split("/")[0].trim()) ? "bg-ok-50 text-ok" : "bg-sand/70 text-ink-2")}>
                  {u}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeedbackView({ fb, task, text, previous, aiError, onRewrite }: { fb: WritingFeedback; task: WritingTask; text: string; previous?: number; aiError: string | null; onRewrite: () => void }) {
  const [showModel, setShowModel] = useState(false);
  const statusTone = { good: "ok", ok: "accent", weak: "bad" } as const;
  return (
    <div className="animate-rise space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="eyebrow mb-1">Estimated level</div>
            <div className="font-display text-5xl text-ink">{fb.estimatedLevel}</div>
            <div className="mt-1 text-[13px] text-muted">
              {fb.scaleScore} · {gradeFor(fb.scaleScore)}
            </div>
            {previous && (
              <div className={cx("mt-2 inline-flex items-center gap-1 text-[13px] font-medium", fb.scaleScore >= previous ? "text-ok" : "text-bad")}>
                <TrendingUp size={14} /> {fb.scaleScore >= previous ? "+" : ""}
                {fb.scaleScore - previous} vs your previous task
              </div>
            )}
          </div>
          <div className="grid flex-1 gap-3">
            {fb.criteria.map((c) => (
              <div key={c.key}>
                <div className="mb-1 flex justify-between text-[13px]">
                  <span className="text-ink-2">{c.label}</span>
                  <span className="tabular font-medium text-ink">{c.band.toFixed(1)} / 5</span>
                </div>
                <ProgressBar value={c.band} max={5} tone={c.band >= 3 ? "ok" : "accent"} />
                <div className="mt-0.5 text-[11.5px] text-muted">{c.comment}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[12px] text-muted">
          <Badge tone={fb.source === "claude" ? "gold" : "neutral"}>{fb.source === "claude" ? <><Sparkles size={11} /> AI examiner feedback</> : "Offline analysis"}</Badge>
          Unofficial estimate — not a Cambridge score. A band of 3/5 on each criterion is roughly a C1 pass.
          {aiError && <span className="text-bad">{aiError}</span>}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <CardHeader eyebrow="What works" />
          <ul className="space-y-2 text-[14px] text-ink-2">
            {fb.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-ok" /> {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <CardHeader eyebrow="Priorities for your next draft" />
          <ol className="space-y-2 text-[14px] text-ink-2">
            {fb.priorities.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="tabular mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-50 text-[11px] font-semibold text-accent-700">{i + 1}</span> {s}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader eyebrow="Checks" title="Grammar, vocabulary, cohesion, register and task fulfilment" />
        <ul className="divide-y divide-line">
          {fb.checks.map((c) => (
            <li key={c.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex w-48 shrink-0 items-center gap-2">
                <Badge tone={statusTone[c.status]}>{c.status === "good" ? "Good" : c.status === "ok" ? "OK" : "Work on it"}</Badge>
                <span className="text-[13.5px] font-medium text-ink">{c.label}</span>
              </div>
              <p className="text-[13.5px] text-ink-2">{c.note}</p>
            </li>
          ))}
        </ul>
      </Card>

      {fb.corrections.length > 0 && (
        <Card className="p-6">
          <CardHeader eyebrow="Corrections" title="Fix these yourself — then compare" />
          <ul className="space-y-3">
            {fb.corrections.map((c, i) => (
              <li key={i} className="rounded-xl bg-paper p-3.5">
                <div className="text-[14.5px]">
                  <span className="text-bad line-through decoration-1">{c.original}</span> <span className="mx-1 text-faint">→</span> <span className="font-medium text-ok">{c.suggestion}</span>
                </div>
                <p className="mt-1 text-[13px] text-muted">{c.why}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {fb.upgrades.length > 0 && (
        <Card className="p-6">
          <CardHeader eyebrow="Upgrade to C1" title="Expressions that would lift your Language mark" />
          <ul className="space-y-3">
            {fb.upgrades.map((u, i) => (
              <li key={i} className="text-[14px]">
                <span className="text-muted">Instead of</span> <strong className="text-ink">“{u.instead}”</strong> <span className="text-muted">try</span> <strong className="text-accent-700">{u.try}</strong>
                <p className="text-[12.5px] text-muted">{u.why}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        <CardHeader eyebrow="Your answer" />
        <div className="whitespace-pre-wrap font-display text-[15.5px] leading-relaxed text-ink-2">{text}</div>
      </Card>

      <Card className="p-6">
        <CardHeader
          eyebrow="Model answer"
          title="A C1 version of the same task"
          action={
            <Button variant="secondary" size="sm" onClick={() => setShowModel((s) => !s)}>
              {showModel ? "Hide" : "Show"}
            </Button>
          }
        />
        {showModel ? (
          <div className="whitespace-pre-wrap font-display text-[15.5px] leading-relaxed text-ink-2">{task.modelAnswer}</div>
        ) : (
          <p className="text-[13.5px] text-muted">Read it after you’ve looked at your own corrections. Notice the paragraph plan and linking, not just the vocabulary.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={onRewrite}>
          <PenLine size={16} /> Write a new version
        </Button>
      </div>
    </div>
  );
}
