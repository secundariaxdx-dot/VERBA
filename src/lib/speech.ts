"use client";
import type { ListeningSegment } from "@/domain/types";

/** Browser text-to-speech (Web Speech API). Works offline in most desktop browsers. */
export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return Promise.resolve([]);
  const v = speechSynthesis.getVoices();
  if (v.length) return Promise.resolve(v);
  return new Promise((resolve) => {
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1200);
  });
}

/** Best available voice for a BCP-47 tag; falls back to any English voice. */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: string, index = 0): SpeechSynthesisVoice | undefined {
  const exact = voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === lang.toLowerCase());
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const list = exact.length ? exact : english;
  return list.length ? list[index % list.length] : undefined;
}

export interface PlayHandle {
  stop(): void;
}

/**
 * Speak a list of segments in order. Speakers with the same accent get
 * different voices (when available) and pitches so they can be told apart.
 */
export async function playSegments(
  segments: ListeningSegment[],
  opts: { rate: number; onSegment?: (i: number) => void; onEnd?: () => void },
): Promise<PlayHandle> {
  const voices = await loadVoices();
  let stopped = false;
  speechSynthesis.cancel();
  // Number speakers per accent so two "en-GB" speakers get different voices.
  const speakerIndex = new Map<string, number>();
  const perLang = new Map<string, number>();
  for (const s of segments) {
    if (speakerIndex.has(s.speaker)) continue;
    const n = perLang.get(s.lang) ?? 0;
    speakerIndex.set(s.speaker, n);
    perLang.set(s.lang, n + 1);
  }
  const queue = segments.map((s, i) => {
    const u = new SpeechSynthesisUtterance(s.text);
    u.lang = s.lang;
    const v = pickVoice(voices, s.lang, speakerIndex.get(s.speaker) ?? 0);
    if (v) u.voice = v;
    u.rate = opts.rate;
    u.pitch = s.pitch ?? 1;
    u.onstart = () => !stopped && opts.onSegment?.(i);
    if (i === segments.length - 1) u.onend = () => !stopped && opts.onEnd?.();
    return u;
  });
  queue.forEach((u) => speechSynthesis.speak(u));
  return {
    stop() {
      stopped = true;
      speechSynthesis.cancel();
    },
  };
}

// ── Speech recognition (Chrome/Edge/Safari: webkitSpeechRecognition) ──

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function recognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function createRecognition(lang: string): RecognitionLike | null {
  if (!recognitionSupported()) return null;
  const w = window as unknown as Record<string, new () => RecognitionLike>;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  const r = new Ctor();
  r.lang = lang;
  r.continuous = true;
  r.interimResults = true;
  return r;
}

export function mediaRecorderSupported(): boolean {
  return typeof window !== "undefined" && "MediaRecorder" in window && Boolean(navigator.mediaDevices?.getUserMedia);
}
