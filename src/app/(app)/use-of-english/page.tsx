"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Play, RotateCcw, Shuffle } from "lucide-react";
import type { Topic, UoEPart } from "@/domain/types";
import { USE_OF_ENGLISH, GRAMMAR } from "@/data";
import { useVerba, snapshot } from "@/store/verba";
import { buildSet } from "@/engine/sets";
import { topicAccuracy } from "@/engine/adaptive";
import { TOPIC_LABEL, TRACKED_TOPICS, bandFor } from "@/engine/levels";
import { Badge, Button, Card, CardHeader, PageHeader, Segmented, cx } from "@/components/ui/primitives";
import { QuizRunner } from "@/components/exercise/QuizRunner";
import { todayISO } from "@/lib/dates";

const PARTS: { value: UoEPart | "mixed"; label: string; desc: string }[] = [
  { value: "mixed", label: "Mixed", desc: "All four parts, adaptive" },
  { value: "multiple-choice-cloze", label: "Part 1 · Multiple-choice cloze", desc: "Collocations, fixed phrases, shades of meaning" },
  { value: "open-cloze", label: "Part 2 · Open cloze", desc: "Grammar words: articles, prepositions, linkers" },
  { value: "word-formation", label: "Part 3 · Word formation", desc: "Prefixes, suffixes, negatives, plurals" },
  { value: "key-word-transformation", label: "Part 4 · Key word transformations", desc: "Same meaning, 3–6 words, key word unchanged" },
];

export default function Page() {
  return (
    <Suspense>
      <UseOfEnglish />
    </Suspense>
  );
}

function UseOfEnglish() {
  const params = useSearchParams();
  const router = useRouter();
  const topicParam = params.get("topic") as Topic | null;
  const attempts = useVerba((s) => s.attempts);
  const mistakes = useVerba((s) => s.mistakes);
  const levels = useVerba((s) => s.levels);
  const [part, setPart] = useState<UoEPart | "mixed">("mixed");
  const [mode, setMode] = useState<"learning" | "exam">("learning");
  const [size, setSize] = useState(8);
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState<string | null>(null);
  // a ?topic= link starts a targeted set straight away
  const active = started !== null || Boolean(topicParam);

  const acc = useMemo(() => topicAccuracy(attempts), [attempts]);
  const ability = levels.useOfEnglish.score;

  const pool = useMemo(() => {
    const base = topicParam ? [...USE_OF_ENGLISH, ...GRAMMAR] : USE_OF_ENGLISH;
    return base.filter((q) => (topicParam ? q.topic === topicParam : true) && (topicParam || part === "mixed" || q.part === part));
  }, [topicParam, part]);

  const questions = useMemo(
    () => (active ? buildSet(pool, snapshot(), size, ability, todayISO()) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, run, pool, size, topicParam],
  );

  const repeatedHere = topicParam ? Object.values(mistakes).filter((m) => m.topic === topicParam && m.timesWrong >= 2 && m.mastery !== "mastered").length : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Use of English"
        title={topicParam ? `Targeted practice: ${TOPIC_LABEL[topicParam]}` : "Cambridge-style Use of English"}
        subtitle={
          topicParam
            ? "Items on this concept only, chosen adaptively. Repeated mistakes come first, followed by similar items."
            : "Original exam-style items. Every answer is explained, wrong answers are saved and scheduled for review, and each set adapts to your level."
        }
        action={
          topicParam ? (
            <Button
              variant="secondary"
              onClick={() => {
                setStarted(null);
                router.push("/use-of-english");
              }}
            >
              All topics
            </Button>
          ) : (
            <Badge tone="accent" className="px-3 py-1 text-[13px]">
              Your level: {bandFor(ability).label}
            </Badge>
          )
        }
      />

      {!active ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="p-6">
            <CardHeader eyebrow="New set" title="Choose a part" />
            <div className="space-y-2">
              {PARTS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPart(p.value)}
                  className={cx("flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition", part === p.value ? "border-accent bg-accent-50/60" : "border-line bg-paper hover:border-line-2")}
                >
                  <span>
                    <span className="block text-[14.5px] font-medium text-ink">{p.label}</span>
                    <span className="block text-[12.5px] text-muted">{p.desc}</span>
                  </span>
                  <span className="tabular shrink-0 text-[12px] text-faint">{p.value === "mixed" ? USE_OF_ENGLISH.length : USE_OF_ENGLISH.filter((q) => q.part === p.value).length} items</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Segmented value={mode} onChange={setMode} options={[{ value: "learning", label: "Learning mode" }, { value: "exam", label: "Exam mode" }]} />
              <Segmented value={String(size) as "6" | "8" | "12"} onChange={(v) => setSize(Number(v))} options={[{ value: "6", label: "6 items" }, { value: "8", label: "8" }, { value: "12", label: "12" }]} />
            </div>
            <p className="mt-3 text-[12.5px] text-muted">{mode === "learning" ? "Feedback and explanation after every item." : "No feedback until the end — like the real paper."}</p>
            <Button size="lg" className="mt-5" onClick={() => setStarted(part)}>
              <Play size={16} /> Start set
            </Button>
          </Card>

          <Card className="p-6">
            <CardHeader eyebrow="Concept tracker" title="Your 17 key concepts" />
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {TRACKED_TOPICS.map((t) => {
                const a = acc.get(t);
                const open = Object.values(mistakes).filter((m) => m.topic === t && m.mastery !== "mastered").length;
                const pct = a ? Math.round(a.acc * 100) : null;
                return (
                  <button key={t} onClick={() => router.push(`/use-of-english?topic=${t}`)} className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-sand/60">
                    <span className={cx("h-2 w-2 shrink-0 rounded-full", pct === null ? "bg-line-2" : pct >= 75 ? "bg-ok" : pct >= 55 ? "bg-accent/60" : "bg-bad")} />
                    <span className="flex-1 truncate text-[13px] text-ink-2 group-hover:text-ink">{TOPIC_LABEL[t]}</span>
                    <span className="tabular text-[11.5px] text-muted">{pct === null ? "—" : `${pct}%`}</span>
                    {open > 0 && <span className="rounded-full bg-bad-50 px-1.5 text-[10.5px] text-bad">{open}</span>}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-[12px] text-muted">Green ≥ 75 % accuracy, orange 55–74 %, red below. Red badges are open mistakes. Click a concept for targeted practice.</p>
          </Card>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          {repeatedHere > 0 && (
            <div className="mb-4 rounded-2xl bg-accent-50/70 px-4 py-3 text-[13.5px] text-ink-2">
              You’ve repeatedly missed {repeatedHere} item{repeatedHere > 1 ? "s" : ""} on this concept — they come first, then similar items.
            </div>
          )}
          <Card className="p-5 sm:p-7">
            <QuizRunner
              key={`${run}-${topicParam}`}
              questions={questions}
              source="use-of-english"
              title={topicParam ? `Use of English: ${TOPIC_LABEL[topicParam]}` : "Use of English set"}
              skill="useOfEnglish"
              activity="use-of-english"
              mode={mode}
              onRestart={() => setRun((r) => r + 1)}
              planBlock={topicParam ? `practice:${topicParam}` : "skill:useOfEnglish"}
            />
          </Card>
          <div className="mt-4 flex flex-wrap gap-2">
            {!topicParam && (
              <Button variant="ghost" onClick={() => setStarted(null)}>
                <RotateCcw size={15} /> Change settings
              </Button>
            )}
            <Button variant="ghost" onClick={() => setRun((r) => r + 1)}>
              <Shuffle size={15} /> New set
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
