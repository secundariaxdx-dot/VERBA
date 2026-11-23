"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { ListeningTrack } from "@/domain/types";
import { playSegments, ttsSupported, type PlayHandle } from "@/lib/speech";
import { Badge, Segmented, cx } from "@/components/ui/primitives";

/**
 * Text-to-speech player. Learning mode: replay freely and slow down.
 * Exam mode: two plays at normal speed, like the real paper.
 */
export function ListeningPlayer({ track, mode, showTranscript, onPlayed }: { track: ListeningTrack; mode: "learning" | "exam"; showTranscript: boolean; onPlayed?: (plays: number) => void }) {
  const [supported] = useState(() => ttsSupported());
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  const [plays, setPlays] = useState(0);
  const [rate, setRate] = useState<"0.8" | "0.9" | "1">("1");
  const handle = useRef<PlayHandle | null>(null);
  const maxPlays = mode === "exam" ? 2 : Infinity;

  useEffect(() => {
    return () => handle.current?.stop();
  }, []);

  async function play() {
    if (plays >= maxPlays) return;
    setPlaying(true);
    const n = plays + 1;
    setPlays(n);
    onPlayed?.(n);
    handle.current = await playSegments(track.segments, {
      rate: mode === "exam" ? 1 : Number(rate),
      onSegment: setCurrent,
      onEnd: () => {
        setPlaying(false);
        setCurrent(-1);
      },
    });
  }

  function stop() {
    handle.current?.stop();
    setPlaying(false);
    setCurrent(-1);
  }

  const speakers = [...new Map(track.segments.map((s) => [s.speaker, s.lang])).entries()];

  return (
    <div>
      <div className="rounded-2xl bg-ink p-5 text-card">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-card/70">
          <span className="eyebrow !text-card/60">{track.format}</span>
          {track.accents.map((a) => (
            <span key={a} className="rounded-full border border-card/20 px-2 py-0.5">
              {a}
            </span>
          ))}
        </div>
        <p className="mb-5 text-[14.5px] italic leading-relaxed text-card/85">{track.context}</p>
        {supported ? (
          <div className="flex flex-wrap items-center gap-3">
            {playing ? (
              <button onClick={stop} className="grid h-14 w-14 place-items-center rounded-full bg-accent text-card transition hover:bg-accent-600" aria-label="Stop">
                <Pause size={22} />
              </button>
            ) : (
              <button onClick={play} disabled={plays >= maxPlays} className="grid h-14 w-14 place-items-center rounded-full bg-accent text-card transition hover:bg-accent-600 disabled:opacity-40" aria-label={plays ? "Play again" : "Play"}>
                {plays ? <RotateCcw size={20} /> : <Play size={22} className="translate-x-0.5" />}
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex h-8 items-end gap-[3px]" aria-hidden>
                {Array.from({ length: 42 }, (_, i) => (
                  <span key={i} className={cx("w-[3px] rounded-full bg-card/30 transition-all", playing && "animate-pulse bg-accent-100")} style={{ height: `${20 + Math.abs(Math.sin(i * 1.7 + (current + 1))) * 80}%`, animationDelay: `${(i % 7) * 90}ms` }} />
                ))}
              </div>
              <div className="mt-1 text-[12px] text-card/60">
                {playing ? `Speaking: ${track.segments[current]?.speaker ?? "…"}` : plays ? `Played ${plays}${mode === "exam" ? " of 2" : ""} time${plays > 1 ? "s" : ""}` : mode === "exam" ? "You will hear the recording twice." : "Press play when you’ve read the questions."}
              </div>
            </div>
            {mode === "learning" && (
              <Segmented value={rate} onChange={setRate} options={[{ value: "0.8", label: "0.8×" }, { value: "0.9", label: "0.9×" }, { value: "1", label: "1×" }]} className="!bg-card/10 [&_button]:!text-card/80 [&_button[aria-selected=true]]:!bg-card [&_button[aria-selected=true]]:!text-ink" />
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl bg-card/10 p-3 text-[13.5px] text-card/85">
            <VolumeX size={18} className="mt-0.5 shrink-0" /> This browser has no text-to-speech voices. Use Chrome, Edge or Safari — or open the transcript below and treat it as a reading task.
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-[11.5px] text-card/60">
          <Volume2 size={13} />
          {speakers.map(([s, l]) => (
            <span key={s}>
              {s} <span className="text-card/40">({l})</span>
            </span>
          ))}
        </div>
      </div>
      {(showTranscript || !supported) && (
        <details className="mt-4 rounded-2xl border border-line bg-paper p-4" open={!supported}>
          <summary className="cursor-pointer text-[13.5px] font-medium text-ink-2">Transcript</summary>
          <div className="mt-3 space-y-3 text-[14.5px] leading-relaxed">
            {track.segments.map((s, i) => (
              <p key={i} className={cx(i === current && "rounded-lg bg-accent-50")}>
                <Badge tone="outline" className="mr-2">
                  {s.speaker}
                </Badge>
                <span className="text-ink-2">{s.text}</span>
              </p>
            ))}
          </div>
        </details>
      )}
      {!showTranscript && supported && mode === "learning" && <p className="mt-3 text-[12.5px] text-muted">The transcript unlocks when you finish the questions.</p>}
      {mode === "exam" && plays >= 2 && !playing && <p className="mt-3 text-[12.5px] text-muted">Both plays used — as in the exam.</p>}
    </div>
  );
}
