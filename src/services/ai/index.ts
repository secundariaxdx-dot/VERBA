"use client";
import type { ChatMessage, WritingFeedback, WritingTask } from "@/domain/types";
import { bandFor } from "@/engine/levels";

/**
 * Client-side AI service. It never holds an API key: it calls VERBA's own
 * server routes, which hold the key. When those return 503 (no key), callers
 * use the local engines instead — the app is fully usable either way.
 */
let status: Promise<boolean> | null = null;

export function aiAvailable(): Promise<boolean> {
  status ??= fetch("/api/ai")
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((j: { enabled: boolean }) => Boolean(j.enabled))
    .catch(() => false);
  return status;
}

export async function askTutor(context: string, history: ChatMessage[], message: string): Promise<string> {
  const res = await fetch("/api/tutor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ context, history: history.map((m) => ({ role: m.role, text: m.text })), message }),
  });
  const json = (await res.json()) as { reply?: string; error?: string };
  if (!res.ok || !json.reply) throw new Error(json.error ?? "Tutor unavailable");
  return json.reply;
}

const LABELS = { content: "Content", communicative: "Communicative achievement", organisation: "Organisation", language: "Language" } as const;

/** Claude feedback merged over the local analysis (local checks are kept). */
export async function aiWritingFeedback(task: WritingTask, text: string, local: WritingFeedback): Promise<WritingFeedback> {
  const res = await fetch("/api/writing", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ task: { genre: task.genre, prompt: task.prompt, requirements: task.requirements, wordRange: task.wordRange, register: task.register }, text }),
  });
  if (!res.ok) throw new Error("AI feedback unavailable");
  const j = (await res.json()) as {
    scaleScore: number;
    criteria: { key: keyof typeof LABELS; band: number; comment: string }[];
    corrections: WritingFeedback["corrections"];
    upgrades: WritingFeedback["upgrades"];
    strengths: string[];
    priorities: string[];
  };
  const score = Math.max(140, Math.min(210, Math.round(j.scaleScore)));
  return {
    ...local,
    scaleScore: score,
    estimatedLevel: bandFor(score).label,
    criteria: j.criteria.map((c) => ({ key: c.key, label: LABELS[c.key] ?? c.key, band: Math.max(0, Math.min(5, c.band)), comment: c.comment })),
    corrections: j.corrections.length ? j.corrections : local.corrections,
    upgrades: j.upgrades.length ? j.upgrades : local.upgrades,
    strengths: j.strengths,
    priorities: j.priorities,
    source: "claude",
  };
}
