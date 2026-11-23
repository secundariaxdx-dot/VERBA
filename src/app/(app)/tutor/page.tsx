"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Eraser, Loader2, Sparkles } from "lucide-react";
import type { ChatMessage, Question } from "@/domain/types";
import { getQuestion } from "@/data";
import { useVerba, snapshot } from "@/store/verba";
import { localTutor, tutorContext } from "@/engine/tutor";
import { aiAvailable, askTutor } from "@/services/ai";
import { QuestionCard } from "@/components/exercise/QuestionCard";
import { Badge, Button, Card, Rich, cx } from "@/components/ui/primitives";
import { LogoMark } from "@/components/ui/Logo";
import { bandFor } from "@/engine/levels";
import { overallScore } from "@/engine/adaptive";

const SUGGESTIONS = [
  "Why is my last answer incorrect?",
  "Explain inversion in Spanish",
  "Give me 10 similar questions",
  "What is the difference between actually and currently?",
  "Improve my essay",
  "Practise speaking with me",
  "Quiz me on vocabulary",
  "Create a study session for today",
];

function InlineQuiz({ ids }: { ids: string[] }) {
  const recordAnswer = useVerba((s) => s.recordAnswer);
  const qs = ids.map((id) => getQuestion(id)).filter((q): q is Question => Boolean(q));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  if (!qs.length) return null;
  if (i >= qs.length)
    return (
      <div className="mt-3 rounded-xl bg-ok-50 px-4 py-3 text-[14px] text-ink">
        Done: {score}/{qs.length}. Wrong answers were added to My Mistakes.
      </div>
    );
  const q = qs[i];
  return (
    <div className="mt-3 rounded-2xl border border-line bg-paper p-4">
      <QuestionCard
        key={q.id}
        q={q}
        index={i}
        total={qs.length}
        onAnswered={(c, a) => {
          recordAnswer(q, a, c, "drill");
          if (c) setScore((s) => s + 1);
        }}
        onNext={() => setI(i + 1)}
        nextLabel={i + 1 >= qs.length ? "Finish" : "Next"}
      />
    </div>
  );
}

function Message({ m }: { m: ChatMessage }) {
  const mine = m.role === "user";
  return (
    <div className={cx("flex gap-3", mine && "flex-row-reverse")}>
      {!mine && <LogoMark size={30} className="mt-1 shrink-0" />}
      <div className={cx("min-w-0", mine ? "max-w-[80%]" : "max-w-[92%] flex-1")}>
        <div className={cx("rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed", mine ? "bg-ink text-card" : "border border-line/70 bg-card text-ink-2 shadow-[var(--shadow-soft)]")}>
          <Rich text={m.text} />
        </div>
        {m.quiz && m.quiz.length > 0 && <InlineQuiz ids={m.quiz} />}
        {m.links && m.links.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] font-medium text-accent-700 hover:border-accent">
                {l.label} →
              </Link>
            ))}
          </div>
        )}
        {!mine && m.source && <div className="mt-1 text-[11px] text-faint">{m.source === "claude" ? "Claude" : "Offline tutor"}</div>}
      </div>
    </div>
  );
}

export default function Tutor() {
  const chat = useVerba((s) => s.chat);
  const addChat = useVerba((s) => s.addChat);
  const clearChat = useVerba((s) => s.clearChat);
  const logSession = useVerba((s) => s.logSession);
  const levels = useVerba((s) => s.levels);
  const name = useVerba((s) => s.profile?.name);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiAvailable().then(setAi);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    const history = useVerba.getState().chat;
    addChat({ role: "user", text: t });
    setBusy(true);
    const data = snapshot();
    // Structured requests (quizzes, today's plan, last mistake) are handled locally
    // even with AI enabled, because they use your real data and interactive items.
    const local = localTutor(t, data);
    const structured = Boolean(local.quiz?.length) || /study session|today|last answer|incorrect|wrong/i.test(t);
    if (ai && !structured) {
      try {
        const reply = await askTutor(tutorContext(data), history, t);
        addChat({ role: "tutor", text: reply, source: "claude" });
      } catch {
        addChat({ ...local, role: "tutor" });
      }
    } else {
      await new Promise((r) => setTimeout(r, 250));
      addChat({ ...local, role: "tutor" });
    }
    setBusy(false);
    if (history.length % 6 === 0) logSession({ minutes: 3, activity: "tutor", title: "AI tutor conversation" });
  }

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1.5">AI Tutor</div>
          <h1 className="text-[2rem] font-medium leading-tight text-ink">Ask me anything about your English</h1>
          <p className="mt-1.5 text-[14.5px] text-muted">
            I know your level ({bandFor(overallScore(levels)).label}), your plan, your mistakes and your vocabulary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ai === null ? null : ai ? (
            <Badge tone="gold">
              <Sparkles size={11} /> Claude connected
            </Badge>
          ) : (
            <Badge tone="neutral">
              <Bot size={11} /> Offline tutor
            </Badge>
          )}
          {chat.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Eraser size={14} /> Clear
            </Button>
          )}
        </div>
      </div>

      <Card className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="flex-1 space-y-5">
          {chat.length === 0 && (
            <div className="py-6 text-center">
              <LogoMark size={44} className="mx-auto" />
              <p className="mx-auto mt-4 max-w-md font-display text-[18px] text-ink">Hi {name}. What shall we work on?</p>
              <p className="mx-auto mt-1 max-w-md text-[13.5px] text-muted">{ai ? "Open questions go to Claude with your learning context. Quizzes and plans use your own data." : "Running offline: I answer from VERBA’s own content and your data. Add ANTHROPIC_API_KEY on the server for open conversation."}</p>
            </div>
          )}
          {chat.map((m) => (
            <Message key={m.id} m={m} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-[13px] text-muted">
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="no-scrollbar -mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy} className="shrink-0 rounded-full border border-line bg-paper px-3 py-1.5 text-[12.5px] text-ink-2 hover:border-accent/50 hover:text-ink disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask about grammar, vocabulary, your essay…"
            className="max-h-40 min-h-12 flex-1 resize-none rounded-2xl border border-line bg-paper px-4 py-3 text-[15px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
            aria-label="Message"
          />
          <button type="submit" disabled={!input.trim() || busy} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-card transition hover:bg-accent-600 disabled:opacity-40" aria-label="Send">
            <ArrowUp size={19} />
          </button>
        </form>
      </Card>
    </div>
  );
}
