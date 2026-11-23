"use client";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Headphones } from "lucide-react";
import type { Accent, ListeningTrack, Topic } from "@/domain/types";
import { LISTENING } from "@/data";
import { useVerba } from "@/store/verba";
import { ListeningPlayer } from "@/components/skills/ListeningPlayer";
import { QuizRunner } from "@/components/exercise/QuizRunner";
import { Badge, Card, CardHeader, PageHeader, ProgressBar, Segmented, cx } from "@/components/ui/primitives";
import { TOPIC_LABEL, bandFor, levelFor } from "@/engine/levels";

export default function Page() {
  return (
    <Suspense>
      <Listening />
    </Suspense>
  );
}

function Session({ track }: { track: ListeningTrack }) {
  const [mode, setMode] = useState<"learning" | "exam">("learning");
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[1.6rem] leading-tight text-ink">{track.title}</h2>
            <div className="mt-1 flex gap-1.5">
              <Badge tone="neutral">{track.level}</Badge>
              <Badge tone="outline">{track.theme}</Badge>
            </div>
          </div>
          {!started && <Segmented value={mode} onChange={setMode} options={[{ value: "learning", label: "Learning" }, { value: "exam", label: "Exam mode" }]} />}
        </div>
        <ListeningPlayer key={mode} track={track} mode={mode} showTranscript={finished} onPlayed={() => setStarted(true)} />
        <p className="mt-3 text-[12.5px] text-muted">{mode === "learning" ? "Learning mode: replay as often as you like, slow down to 0.8×, and read the transcript afterwards." : "Exam mode: two plays at normal speed, no transcript until you finish."}</p>
      </div>
      <Card className="p-5 sm:p-7">
        <QuizRunner key={mode} questions={track.questions} source="listening" title={`Listening: ${track.title}`} skill="listening" activity="listening" mode={mode} planBlock="skill:listening" onFinish={() => setFinished(true)} />
      </Card>
    </div>
  );
}

function Listening() {
  const params = useSearchParams();
  const router = useRouter();
  const track = LISTENING.find((t) => t.id === params.get("id"));
  const attempts = useVerba((s) => s.attempts);
  const sessions = useVerba((s) => s.sessions);
  const score = useVerba((s) => s.levels.listening.score);
  const target = levelFor(score + 4);

  const stats = useMemo(() => {
    const bySub = new Map<Topic, { c: number; t: number }>();
    const byAccent = new Map<Accent, { c: number; t: number }>();
    const accentOf = new Map(LISTENING.flatMap((t) => t.questions.map((q) => [q.id, t.accents] as const)));
    for (const a of attempts.filter((a) => a.skill === "listening")) {
      const s = bySub.get(a.topic) ?? { c: 0, t: 0 };
      s.t++;
      if (a.correct) s.c++;
      bySub.set(a.topic, s);
      for (const acc of accentOf.get(a.questionId) ?? []) {
        const x = byAccent.get(acc) ?? { c: 0, t: 0 };
        x.t++;
        if (a.correct) x.c++;
        byAccent.set(acc, x);
      }
    }
    return { bySub, byAccent };
  }, [attempts]);

  if (track) {
    return (
      <div>
        <button onClick={() => router.push("/listening")} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <ArrowLeft size={15} /> All recordings
        </button>
        <Session key={track.id} track={track} />
      </div>
    );
  }

  const done = new Set(sessions.filter((s) => s.activity === "listening").map((s) => s.title));
  return (
    <div>
      <PageHeader eyebrow="Listening" title="Train your ear for C1" subtitle={`Conversations, interviews, lectures and news in several accents, voiced by your browser’s text-to-speech. Your listening is estimated at ${bandFor(score).label}.`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {[...LISTENING]
            .sort((a, b) => Number(b.level === target) - Number(a.level === target))
            .map((t) => (
              <Link key={t.id} href={`/listening?id=${t.id}`} className="group">
                <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-lift)]">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Badge tone="accent">{t.format}</Badge>
                    <Badge tone="neutral">{t.level}</Badge>
                    {t.level === target && <Badge tone="gold">Recommended</Badge>}
                    {done.has(`Listening: ${t.title}`) && (
                      <Badge tone="ok">
                        <Check size={11} /> Done
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-[17px] font-medium leading-snug text-ink">{t.title}</h3>
                  <p className="mt-1.5 flex-1 text-[13.5px] text-muted">{t.context}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-[12px] text-faint">
                    <Headphones size={13} /> {t.accents.join(" · ")}
                  </div>
                </Card>
              </Link>
            ))}
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader eyebrow="Error patterns" title="By question type" />
            <ul className="space-y-3">
              {(["detail", "main-idea", "inference", "attitude"] as Topic[]).map((t) => {
                const x = stats.bySub.get(t);
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
          <Card className="p-6">
            <CardHeader eyebrow="Accents" title="Accuracy by accent" />
            {stats.byAccent.size === 0 ? (
              <p className="text-[13.5px] text-muted">Complete a recording to see which accents cost you marks.</p>
            ) : (
              <ul className="space-y-2 text-[13.5px]">
                {[...stats.byAccent.entries()].map(([a, x]) => (
                  <li key={a} className="flex justify-between">
                    <span className="text-ink-2">{a}</span>
                    <span className="tabular text-ink">{Math.round((x.c / x.t) * 100)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
