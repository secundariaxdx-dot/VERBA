"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Keyboard, Mic, MicOff, Play, Square, Star, Timer } from "lucide-react";
import type { SpeakingSession, SpeakingTask } from "@/domain/types";
import { SPEAKING_TASKS } from "@/data";
import { useVerba } from "@/store/verba";
import { evaluateSpeaking } from "@/engine/speakingEval";
import { createRecognition, mediaRecorderSupported, recognitionSupported } from "@/lib/speech";
import { Badge, Button, Card, CardHeader, PageHeader, ProgressBar, cx } from "@/components/ui/primitives";
import { todayISO, uid, formatShort } from "@/lib/dates";
import { wordCount } from "@/lib/text";

const PART_LABEL: Record<SpeakingTask["part"], string> = { interview: "Part 1 · Interview", "long-turn": "Part 2 · Long turn", collaborative: "Part 3 · Collaborative task", discussion: "Part 4 · Discussion" };

export default function Page() {
  return (
    <Suspense>
      <Speaking />
    </Suspense>
  );
}

function Speaking() {
  const params = useSearchParams();
  const task = SPEAKING_TASKS.find((t) => t.id === params.get("id"));
  const sessions = useVerba((s) => s.speaking);
  if (task) return <Session key={params.toString()} task={task} />;
  const parts = ["interview", "long-turn", "collaborative", "discussion"] as const;
  return (
    <div>
      <PageHeader eyebrow="Speaking" title="Speak with structure and range" subtitle="C1-style tasks with preparation and speaking timers. Record yourself where your browser supports it; VERBA transcribes, measures pace, range and linking, and suggests C1 phrases." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {parts.map((p) => (
            <div key={p}>
              <div className="eyebrow mb-2.5">{PART_LABEL[p]}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {SPEAKING_TASKS.filter((t) => t.part === p).map((t) => (
                  <Link key={t.id} href={`/speaking?id=${t.id}`} className="group">
                    <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
                      <div className="mb-2 flex gap-1.5">
                        <Badge tone="neutral">{t.level}</Badge>
                        <Badge tone="outline">{t.theme}</Badge>
                      </div>
                      <h3 className="text-[16.5px] font-medium leading-snug text-ink">{t.title}</h3>
                      <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] text-muted">{t.instructions}</p>
                      <div className="mt-3 text-[12px] text-faint">
                        {t.prepSeconds ? `${t.prepSeconds}s prep · ` : ""}
                        {t.speakSeconds}s speaking
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Card className="h-fit p-6">
          <CardHeader eyebrow="Recent sessions" />
          {sessions.length === 0 ? (
            <p className="text-[13.5px] text-muted">Your speaking sessions and their feedback will appear here.</p>
          ) : (
            <ul className="space-y-2">
              {[...sessions]
                .reverse()
                .slice(0, 8)
                .map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-[13.5px]">
                    <span className="min-w-0">
                      <span className="block truncate text-ink">{SPEAKING_TASKS.find((t) => t.id === s.taskId)?.title}</span>
                      <span className="text-[11.5px] text-muted">
                        {formatShort(s.date.slice(0, 10))} · {s.mode} · {wordCount(s.transcript)} words
                      </span>
                    </span>
                    {s.feedback && <Badge tone="accent">{s.feedback.estimatedLevel}</Badge>}
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

type Phase = "ready" | "prep" | "speak" | "review" | "feedback";

function Session({ task }: { task: SpeakingTask }) {
  const router = useRouter();
  const saveSpeaking = useVerba((s) => s.saveSpeaking);
  const logSession = useVerba((s) => s.logSession);
  const setSkillScore = useVerba((s) => s.setSkillScore);
  const speakingLevel = useVerba((s) => s.levels.speaking.score);
  const markBlock = useVerba((s) => s.markBlock);
  const variety = useVerba((s) => s.profile?.variety);
  const [phase, setPhase] = useState<Phase>("ready");
  const [caps] = useState(() => ({ rec: recognitionSupported(), media: mediaRecorderSupported() }));
  const [mode, setMode] = useState<"voice" | "typed">(() => (caps.rec || caps.media ? "voice" : "typed"));
  const [left, setLeft] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [rating, setRating] = useState<number | undefined>();
  const [result, setResult] = useState<SpeakingSession | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const recRef = useRef<ReturnType<typeof createRecognition>>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startRef = useRef(0);
  const finalRef = useRef("");

  useEffect(() => () => stopAll(), []);

  // countdown
  useEffect(() => {
    if (phase !== "prep" && phase !== "speak") return;
    if (left <= 0) {
      if (phase === "prep") beginSpeaking();
      else finishSpeaking();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopAll() {
    try {
      recRef.current?.stop();
    } catch {}
    if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function start() {
    if (task.prepSeconds > 0) {
      setPhase("prep");
      setLeft(task.prepSeconds);
    } else beginSpeaking();
  }

  async function beginSpeaking() {
    setPhase("speak");
    setLeft(task.speakSeconds);
    startRef.current = Date.now();
    finalRef.current = "";
    if (mode !== "voice") return;
    try {
      if (caps.media) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        mr.ondataavailable = (e) => chunks.push(e.data);
        mr.onstop = () => setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })));
        mr.start();
        mediaRef.current = mr;
      }
      const rec = createRecognition(variety === "american" ? "en-US" : "en-GB");
      if (rec) {
        rec.onresult = (e) => {
          let inter = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) finalRef.current += r[0].transcript + " ";
            else inter += r[0].transcript;
          }
          setTranscript(finalRef.current);
          setInterim(inter);
        };
        rec.onerror = (e) => e.error !== "no-speech" && setMicError(`Speech recognition: ${e.error}. You can type or correct the transcript afterwards.`);
        rec.start();
        recRef.current = rec;
      }
    } catch {
      setMicError("Microphone not available or permission denied. Switched to typed mode.");
      setMode("typed");
    }
  }

  function finishSpeaking() {
    stopAll();
    setDuration(Math.max(1, Math.round((Date.now() - startRef.current) / 1000)));
    setTranscript((t) => (t + " " + interim).trim());
    setInterim("");
    setPhase("review");
  }

  function analyse() {
    const fb = evaluateSpeaking(transcript, mode === "voice" ? duration : task.speakSeconds, task, mode);
    const s: SpeakingSession = { id: uid("sp"), taskId: task.id, date: new Date().toISOString(), transcript, durationSec: duration, mode, selfRating: rating, feedback: fb };
    saveSpeaking(s);
    const avg = fb.scores.reduce((a, b) => a + b.band, 0) / fb.scores.length;
    const scale = 156 + avg * 8;
    setSkillScore("speaking", Math.round((speakingLevel * 0.75 + scale * 0.25) * 10) / 10);
    logSession({ minutes: Math.max(2, Math.round((duration + task.prepSeconds) / 60) + 2), activity: "speaking", skill: "speaking", title: `Speaking: ${task.title}`, score: Math.round((avg / 5) * 100) });
    markBlock(todayISO(), "skill:speaking", "done");
    setResult(s);
    setPhase("feedback");
  }

  const total = phase === "prep" ? task.prepSeconds : task.speakSeconds;

  return (
    <div>
      <button onClick={() => router.push("/speaking")} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={15} /> All tasks
      </button>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6 sm:p-7">
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge tone="accent">{PART_LABEL[task.part]}</Badge>
              <Badge tone="neutral">{task.level}</Badge>
            </div>
            <h1 className="text-[1.7rem] leading-tight text-ink">{task.title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{task.instructions}</p>
            {task.prompts.length > 0 && (
              <div className={cx("mt-5 grid gap-3", task.part === "long-turn" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
                {task.prompts.map((p, i) => (
                  <div key={i} className="rounded-2xl bg-sand/60 p-4 text-[14px] leading-relaxed text-ink-2">
                    {task.part === "long-turn" && <div className="eyebrow mb-1">Picture {String.fromCharCode(65 + i)}</div>}
                    {p}
                  </div>
                ))}
              </div>
            )}
            <ul className="mt-5 space-y-1.5">
              {task.questions.map((q) => (
                <li key={q} className="font-display text-[16.5px] text-ink">
                  — {q}
                </li>
              ))}
            </ul>
          </Card>

          {phase === "feedback" && result?.feedback && (
            <Card className="animate-rise p-6 sm:p-7">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="eyebrow mb-1">Estimated level (unofficial)</div>
                  <div className="font-display text-4xl text-ink">{result.feedback.estimatedLevel}</div>
                </div>
                {result.mode === "voice" && <Badge tone="outline">{result.feedback.wordsPerMinute} words/min</Badge>}
              </div>
              <div className="mt-5 grid gap-3">
                {result.feedback.scores.map((s) => (
                  <div key={s.label}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="text-ink-2">{s.label}</span>
                      <span className="tabular font-medium text-ink">{s.band.toFixed(1)} / 5</span>
                    </div>
                    <ProgressBar value={s.band} max={5} tone={s.band >= 3 ? "ok" : "accent"} />
                    <div className="mt-0.5 text-[11.5px] text-muted">{s.note}</div>
                  </div>
                ))}
                <div className="text-[12px] text-muted">Pronunciation: {result.mode === "voice" ? "listen back to your recording and compare it with the model — automatic pronunciation scoring isn’t reliable in the browser." : "not assessed in typed mode."}</div>
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <div className="eyebrow mb-2">Next time</div>
                <ul className="space-y-1.5 text-[14px] text-ink-2">
                  {result.feedback.tips.map((t) => (
                    <li key={t}>• {t}</li>
                  ))}
                </ul>
              </div>
              {result.feedback.c1Phrases.length > 0 && <p className="mt-4 text-[13px] text-ok">C1 phrases you used: {result.feedback.c1Phrases.join(", ")}</p>}
              <details className="mt-5 rounded-2xl border border-line bg-paper p-4">
                <summary className="cursor-pointer text-[13.5px] font-medium text-ink-2">Model answer</summary>
                <p className="mt-3 font-display text-[15px] leading-relaxed text-ink-2">{task.sample}</p>
              </details>
              <div className="mt-5 flex gap-3">
                <Button onClick={() => router.push(`/speaking?id=${task.id}&again=${Date.now()}`)}>Try again</Button>
                <Button variant="secondary" onClick={() => router.push("/speaking")}>
                  Another task
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-6">
            {phase === "ready" && (
              <div>
                <div className="eyebrow mb-3">How do you want to answer?</div>
                <div className="grid grid-cols-2 gap-2">
                  <button disabled={!caps.rec && !caps.media} onClick={() => setMode("voice")} className={cx("rounded-xl border p-3 text-left disabled:opacity-40", mode === "voice" ? "border-accent bg-accent-50/60" : "border-line")}>
                    <Mic size={18} className="mb-1 text-accent" />
                    <div className="text-[14px] font-medium text-ink">Speak</div>
                    <div className="text-[11.5px] text-muted">{caps.rec ? "Record + transcript" : caps.media ? "Record (type transcript)" : "Not supported here"}</div>
                  </button>
                  <button onClick={() => setMode("typed")} className={cx("rounded-xl border p-3 text-left", mode === "typed" ? "border-accent bg-accent-50/60" : "border-line")}>
                    <Keyboard size={18} className="mb-1 text-accent" />
                    <div className="text-[14px] font-medium text-ink">Type</div>
                    <div className="text-[11.5px] text-muted">Write as you’d speak</div>
                  </button>
                </div>
                <Button size="lg" className="mt-5 w-full" onClick={start}>
                  <Play size={16} /> {task.prepSeconds ? `Start ${task.prepSeconds}s preparation` : "Start speaking"}
                </Button>
              </div>
            )}

            {(phase === "prep" || phase === "speak") && (
              <div className="text-center">
                <div className="eyebrow mb-2">{phase === "prep" ? "Preparation" : mode === "voice" ? "Recording" : "Speaking (typed)"}</div>
                <div className={cx("mx-auto grid h-28 w-28 place-items-center rounded-full font-display text-4xl tabular", phase === "speak" ? "bg-accent text-card" : "bg-sand text-ink")}>
                  {phase === "speak" && mode === "voice" ? (
                    <span className="flex flex-col items-center">
                      <Mic size={22} className="animate-pulse" />
                      {left}
                    </span>
                  ) : (
                    left
                  )}
                </div>
                <ProgressBar value={total - left} max={total} className="mx-auto mt-4 max-w-[220px]" />
                {phase === "speak" && mode === "typed" && (
                  <textarea autoFocus value={transcript} onChange={(e) => setTranscript(e.target.value)} className="mt-4 min-h-40 w-full rounded-xl border border-line bg-paper p-3 text-[14.5px] focus:border-accent focus:outline-none" placeholder="Type your spoken answer…" />
                )}
                {phase === "speak" && mode === "voice" && (transcript || interim) && (
                  <p className="mt-4 max-h-40 overflow-y-auto text-left text-[13.5px] text-ink-2">
                    {transcript}
                    <span className="text-faint">{interim}</span>
                  </p>
                )}
                <div className="mt-4 flex justify-center gap-2">
                  {phase === "prep" ? (
                    <Button variant="secondary" onClick={beginSpeaking}>
                      <Timer size={15} /> Skip preparation
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={finishSpeaking}>
                      <Square size={14} /> Stop
                    </Button>
                  )}
                </div>
              </div>
            )}

            {phase === "review" && (
              <div>
                <div className="eyebrow mb-2">Review</div>
                {audioUrl && <audio src={audioUrl} controls className="mb-3 w-full" />}
                {micError && (
                  <p className="mb-2 flex items-start gap-1.5 text-[12.5px] text-bad">
                    <MicOff size={14} className="mt-0.5 shrink-0" /> {micError}
                  </p>
                )}
                <label className="mb-1 block text-[13px] text-ink-2">{mode === "voice" ? "Transcript — correct any recognition errors" : "Your answer"}</label>
                <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} className="min-h-40 w-full rounded-xl border border-line bg-paper p-3 text-[14.5px] focus:border-accent focus:outline-none" placeholder={mode === "voice" && !caps.rec ? "Your browser can record but not transcribe. Listen back and type what you said." : ""} />
                <div className="mt-3">
                  <div className="mb-1 text-[13px] text-ink-2">How did it feel?</div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)} aria-label={`${n} of 5`}>
                        <Star size={20} className={cx(rating && n <= rating ? "fill-accent text-accent" : "text-line-2")} />
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="mt-4 w-full" onClick={analyse} disabled={wordCount(transcript) < 10}>
                  Get feedback
                </Button>
              </div>
            )}

            {phase === "feedback" && <p className="text-[13.5px] text-muted">Session saved. Your speaking estimate has been updated.</p>}
          </Card>

          <Card className="p-6">
            <div className="eyebrow mb-2">Useful language</div>
            <ul className="flex flex-wrap gap-1.5">
              {task.usefulLanguage.map((u) => (
                <li key={u} className={cx("rounded-full px-2.5 py-1 text-[12.5px]", transcript.toLowerCase().includes(u.toLowerCase().replace(/[.…]+$/, "").split("/")[0].trim()) ? "bg-ok-50 text-ok" : "bg-sand/70 text-ink-2")}>
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
