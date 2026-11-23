"use client";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Gauge } from "lucide-react";
import { READING } from "@/data";
import { useVerba } from "@/store/verba";
import { ReadingTask } from "@/components/skills/ReadingTask";
import { Badge, Card, CardHeader, PageHeader, ProgressBar, cx } from "@/components/ui/primitives";
import { TOPIC_LABEL, bandFor, levelFor } from "@/engine/levels";
import { wordCount } from "@/lib/text";
import type { Topic } from "@/domain/types";

export default function Page() {
  return (
    <Suspense>
      <Reading />
    </Suspense>
  );
}

const SUBSKILLS: Topic[] = ["main-idea", "detail", "inference", "attitude", "meaning-from-context", "text-structure"];

function Reading() {
  const params = useSearchParams();
  const router = useRouter();
  const text = READING.find((t) => t.id === params.get("id"));
  const attempts = useVerba((s) => s.attempts);
  const sessions = useVerba((s) => s.sessions);
  const speed = useVerba((s) => s.readingSpeed);
  const score = useVerba((s) => s.levels.reading.score);
  const target = levelFor(score + 4);

  const sub = useMemo(() => {
    const m = new Map<Topic, { c: number; t: number }>();
    for (const a of attempts.filter((a) => a.skill === "reading")) {
      const x = m.get(a.topic) ?? { c: 0, t: 0 };
      x.t++;
      if (a.correct) x.c++;
      m.set(a.topic, x);
    }
    return m;
  }, [attempts]);

  if (text) {
    return (
      <div>
        <button onClick={() => router.push("/reading")} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <ArrowLeft size={15} /> All texts
        </button>
        <ReadingTask key={text.id} text={text} />
      </div>
    );
  }

  const avgWpm = speed.length ? Math.round(speed.slice(-5).reduce((s, x) => s + x.wpm, 0) / Math.min(5, speed.length)) : null;
  const doneTitles = new Set(sessions.filter((s) => s.activity === "reading").map((s) => s.title));
  const sorted = [...READING].sort((a, b) => Number(b.level === target) - Number(a.level === target));

  return (
    <div>
      <PageHeader eyebrow="Reading" title="Read like an examiner expects" subtitle={`Original texts from B2 to C1+. Your reading is estimated at ${bandFor(score).label}, so ${target} texts are recommended first${score >= 180 ? " — B2 texts are hidden from recommendations." : "."}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted
            .filter((t) => !(score >= 180 && t.level === "B2"))
            .map((t) => {
              const done = doneTitles.has(`Reading: ${t.title}`);
              return (
                <Link key={t.id} href={`/reading?id=${t.id}`} className="group">
                  <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      <Badge tone="accent">{t.genre}</Badge>
                      <Badge tone="neutral">{t.level}</Badge>
                      {t.level === target && <Badge tone="gold">Recommended</Badge>}
                      {done && (
                        <Badge tone="ok">
                          <Check size={11} /> Done
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-[17px] font-medium leading-snug text-ink">{t.title}</h3>
                    <p className="mt-1.5 line-clamp-3 flex-1 text-[13.5px] text-muted">{t.paragraphs[0]}</p>
                    <div className="mt-4 text-[12px] text-faint">
                      {wordCount(t.paragraphs.join(" "))} words · {t.questions.length} questions · {t.theme}
                    </div>
                  </Card>
                </Link>
              );
            })}
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader eyebrow="Reading speed" title={avgWpm ? `${avgWpm} words / min` : "Not measured yet"} />
            <div className="flex items-center gap-2 text-[13px] text-muted">
              <Gauge size={15} className="text-accent" /> C1 candidates typically read 180–250 wpm with good comprehension.
            </div>
            {avgWpm && <ProgressBar value={avgWpm} max={250} className="mt-3" />}
          </Card>
          <Card className="p-6">
            <CardHeader eyebrow="Comprehension by question type" title="Where marks are lost" />
            <ul className="space-y-3">
              {SUBSKILLS.map((t) => {
                const x = sub.get(t);
                const pct = x ? Math.round((x.c / x.t) * 100) : null;
                return (
                  <li key={t}>
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="text-ink-2">{TOPIC_LABEL[t]}</span>
                      <span className={cx("tabular", pct === null ? "text-faint" : pct < 60 ? "text-bad" : "text-ink")}>{pct === null ? "—" : `${pct}%`}</span>
                    </div>
                    <ProgressBar value={pct ?? 0} tone={pct !== null && pct >= 75 ? "ok" : "accent"} />
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
