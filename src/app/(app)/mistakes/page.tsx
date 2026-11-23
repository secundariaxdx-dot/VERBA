"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, Play, Repeat, Trash2 } from "lucide-react";
import type { Mastery, Mistake, Question, Topic } from "@/domain/types";
import { getQuestion } from "@/data";
import { useVerba } from "@/store/verba";
import { TOPIC_LABEL, SKILL_LABEL } from "@/engine/levels";
import { Badge, Button, ButtonLink, Card, CardHeader, Chip, Empty, PageHeader, Stat, cx } from "@/components/ui/primitives";
import { QuizRunner } from "@/components/exercise/QuizRunner";
import { formatShort, todayISO } from "@/lib/dates";

const MASTERY: { value: Mastery; label: string; tone: "bad" | "accent" | "gold" | "ok" }[] = [
  { value: "new", label: "New", tone: "bad" },
  { value: "learning", label: "Learning", tone: "accent" },
  { value: "improving", label: "Improving", tone: "gold" },
  { value: "mastered", label: "Mastered", tone: "ok" },
];

export default function Page() {
  return (
    <Suspense>
      <Mistakes />
    </Suspense>
  );
}

function Mistakes() {
  const params = useSearchParams();
  const router = useRouter();
  const mistakes = useVerba((s) => s.mistakes);
  const list = useMemo(() => Object.values(mistakes).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)), [mistakes]);
  const [topic, setTopic] = useState<Topic | "all">("all");
  const [mastery, setMastery] = useState<Mastery | "open" | "all">("open");
  const [open, setOpen] = useState<string | null>(null);
  const today = todayISO();
  const practising = params.get("mode") === "practice";
  const practiceTopic = params.get("topic") as Topic | null;

  const due = list.filter((m) => m.mastery !== "mastered" && m.due <= today);
  const repeated = list.filter((m) => m.timesWrong >= 2 && m.mastery !== "mastered");
  const topics = [...new Set(list.map((m) => m.topic))];
  const filtered = list.filter((m) => (topic === "all" || m.topic === topic) && (mastery === "all" || (mastery === "open" ? m.mastery !== "mastered" : m.mastery === mastery)));

  if (practising) {
    return <Practice due={practiceTopic ? list.filter((m) => m.topic === practiceTopic && m.mastery !== "mastered") : due.length ? due : list.filter((m) => m.mastery !== "mastered")} onExit={() => router.push("/mistakes")} topic={practiceTopic} />;
  }

  const byTopic = topics
    .map((t) => ({ t, open: list.filter((m) => m.topic === t && m.mastery !== "mastered").length, total: list.filter((m) => m.topic === t).length }))
    .sort((a, b) => b.open - a.open);

  return (
    <div>
      <PageHeader
        eyebrow="My mistakes"
        title="Every error is a lesson"
        subtitle="Wrong answers from every part of VERBA are stored here with the explanation. They return on a spaced schedule, and repeated ones push their topic up your study plan."
        action={
          <ButtonLink href="/mistakes?mode=practice" size="lg">
            <Play size={16} /> Practise {due.length ? `${due.length} due` : "open mistakes"}
          </ButtonLink>
        }
      />
      <Card className="mb-6 grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
        <Stat label="Open" value={list.filter((m) => m.mastery !== "mastered").length} />
        <Stat label="Due today" value={due.length} />
        <Stat label="Repeated" value={repeated.length} hint="wrong 2+ times" />
        <Stat label="Mastered" value={list.filter((m) => m.mastery === "mastered").length} hint="right 3× in a row" />
      </Card>

      {list.length === 0 ? (
        <Empty title="No mistakes yet" action={<ButtonLink href="/use-of-english">Practise Use of English</ButtonLink>}>
          When you answer something incorrectly anywhere in VERBA, it appears here with its explanation.
        </Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["open", "all"] as const).map((m) => (
                <Chip key={m} active={mastery === m} onClick={() => setMastery(m)}>
                  {m === "open" ? "Open" : "All"}
                </Chip>
              ))}
              {MASTERY.map((m) => (
                <Chip key={m.value} active={mastery === m.value} onClick={() => setMastery(m.value)}>
                  {m.label}
                </Chip>
              ))}
              <select value={topic} onChange={(e) => setTopic(e.target.value as Topic | "all")} className="h-9 rounded-full border border-line bg-card px-3 text-[13px] text-ink-2" aria-label="Filter by topic">
                <option value="all">All topics</option>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {TOPIC_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <ul className="space-y-2.5">
              {filtered.map((m) => (
                <MistakeRow key={m.id} m={m} open={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
              ))}
              {filtered.length === 0 && <p className="py-6 text-center text-[14px] text-muted">Nothing matches these filters.</p>}
            </ul>
          </div>
          <div className="space-y-6">
            <Card className="p-6">
              <CardHeader eyebrow="By topic" title="Where errors cluster" />
              <ul className="space-y-2">
                {byTopic.map(({ t, open: o, total }) => (
                  <li key={t} className="flex items-center gap-2 text-[13.5px]">
                    <span className="flex-1 truncate text-ink-2">{TOPIC_LABEL[t]}</span>
                    <span className="tabular text-muted">
                      {o}/{total}
                    </span>
                    <Link href={`/mistakes?mode=practice&topic=${t}`} className="rounded-full p-1 text-accent hover:bg-accent-50" aria-label={`Practise ${TOPIC_LABEL[t]}`}>
                      <Repeat size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <CardHeader eyebrow="Improvement" title="Mastery pipeline" />
              <div className="flex h-3 overflow-hidden rounded-full bg-sand">
                {MASTERY.map((s) => {
                  const n = list.filter((m) => m.mastery === s.value).length;
                  return <div key={s.value} title={`${s.label}: ${n}`} className={cx("h-full border-r-2 border-card last:border-0", s.tone === "bad" ? "bg-bad/70" : s.tone === "accent" ? "bg-accent/70" : s.tone === "gold" ? "bg-gold/70" : "bg-ok")} style={{ width: `${(n / list.length) * 100}%` }} />;
                })}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-1.5 text-[12.5px]">
                {MASTERY.map((s) => (
                  <li key={s.value} className="flex justify-between text-ink-2">
                    {s.label} <span className="tabular text-ink">{list.filter((m) => m.mastery === s.value).length}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function MistakeRow({ m, open, onToggle }: { m: Mistake; open: boolean; onToggle: () => void }) {
  const del = useVerba((s) => s.deleteMistake);
  const tone = MASTERY.find((x) => x.value === m.mastery)!.tone;
  return (
    <li>
      <Card className="p-4">
        <button onClick={onToggle} className="flex w-full items-start gap-3 text-left" aria-expanded={open}>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone={tone}>{MASTERY.find((x) => x.value === m.mastery)!.label}</Badge>
              <Badge tone="outline">{TOPIC_LABEL[m.topic]}</Badge>
              {m.timesWrong > 1 && <Badge tone="bad">Wrong {m.timesWrong}×</Badge>}
            </div>
            <p className={cx("text-[14.5px] text-ink", !open && "line-clamp-2")}>
              {m.original ? `${m.original} → ` : ""}
              {m.prompt}
            </p>
            <p className="mt-1 text-[13.5px]">
              <span className="text-bad line-through decoration-1">{m.yourAnswer || "—"}</span> <span className="mx-1 text-faint">→</span> <span className="font-medium text-ok">{m.correctAnswer}</span>
            </p>
          </div>
          <ChevronDown size={16} className={cx("mt-1 shrink-0 text-muted transition", open && "rotate-180")} />
        </button>
        {open && (
          <div className="animate-rise mt-3 border-t border-line pt-3 text-[13.5px]">
            {m.keyword && (
              <p className="mb-1 text-muted">
                Key word: <strong className="text-ink">{m.keyword}</strong>
              </p>
            )}
            {m.stem && (
              <p className="mb-1 text-muted">
                Stem: <strong className="text-ink">{m.stem}</strong>
              </p>
            )}
            <p className="leading-relaxed text-ink-2">{m.explanation}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
              <span>
                {SKILL_LABEL[m.skill]} · {m.level} · first {formatShort(m.firstSeen.slice(0, 10))} · last {formatShort(m.lastSeen.slice(0, 10))} · next review {formatShort(m.due)}
              </span>
              <span className="flex gap-2">
                <ButtonLink href={`/use-of-english?topic=${m.topic}`} size="sm" variant="secondary">
                  Similar questions
                </ButtonLink>
                <Button size="sm" variant="ghost" onClick={() => del(m.id)} aria-label="Delete mistake">
                  <Trash2 size={14} />
                </Button>
              </span>
            </div>
          </div>
        )}
      </Card>
    </li>
  );
}

function Practice({ due, onExit, topic }: { due: Mistake[]; onExit: () => void; topic: Topic | null }) {
  const [questions] = useState<Question[]>(() =>
    due
      .map((m) => getQuestion(m.questionId))
      .filter((q): q is Question => Boolean(q))
      .sort((a, b) => (due.find((m) => m.questionId === b.id)?.timesWrong ?? 0) - (due.find((m) => m.questionId === a.id)?.timesWrong ?? 0))
      .slice(0, 12),
  );
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Mistake review" title={topic ? `Retry: ${TOPIC_LABEL[topic]}` : "Retry your mistakes"} subtitle="Answer each one again. Three correct retries in a row and it’s marked as mastered." action={<Button variant="secondary" onClick={onExit}>Back to list</Button>} />
      {questions.length === 0 ? (
        <Empty title="Nothing to review" action={<Button onClick={onExit}>Back</Button>}>
          No open mistakes here. Well done.
        </Empty>
      ) : (
        <Card className="p-5 sm:p-7">
          <QuizRunner questions={questions} source="mistakes" title="Mistake review" activity="mistakes" planBlock="review" />
        </Card>
      )}
    </div>
  );
}
