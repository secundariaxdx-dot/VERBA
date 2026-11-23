import { aiEnabled, ask } from "@/lib/server/claude";

interface Body {
  task: { genre: string; prompt: string; requirements: string[]; wordRange: [number, number]; register: string };
  text: string;
}

const band = { type: "number" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scaleScore", "criteria", "corrections", "upgrades", "strengths", "priorities"],
  properties: {
    scaleScore: { type: "integer", description: "Estimated Cambridge English Scale score 140-210 for this piece" },
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "band", "comment"],
        properties: {
          key: { type: "string", enum: ["content", "communicative", "organisation", "language"] },
          band,
          comment: { type: "string" },
        },
      },
    },
    corrections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["original", "suggestion", "why"],
        properties: { original: { type: "string" }, suggestion: { type: "string" }, why: { type: "string" } },
      },
    },
    upgrades: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["instead", "try", "why"],
        properties: { instead: { type: "string" }, try: { type: "string" }, why: { type: "string" } },
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    priorities: { type: "array", items: { type: "string" } },
  },
};

const SYSTEM = `You are an experienced Cambridge C1 Advanced writing examiner and teacher. Assess the candidate's answer with the four C1 Writing subscales (Content, Communicative Achievement, Organisation, Language), each banded 0–5 (decimals allowed).

Teach, don't rewrite: give up to 8 specific corrections quoting the candidate's exact words (original), a corrected version (suggestion) and a one-sentence reason a Spanish speaker will understand. Give up to 6 "upgrades": phrases the candidate used that could become more C1 (instead → try), with the reason. List 2–4 strengths and 2–4 priorities for the next draft. Be accurate and fair; the learner is a Spanish speaker around B2/B2+ aiming for C1. The scale score is an unofficial estimate.`;

export async function POST(req: Request) {
  if (!aiEnabled()) return Response.json({ error: "AI feedback not configured" }, { status: 503 });
  const body = (await req.json()) as Body;
  if (!body?.text || body.text.length < 40) return Response.json({ error: "Text too short" }, { status: 400 });
  const prompt = `Task (${body.task.genre}, ${body.task.register} register, ${body.task.wordRange[0]}–${body.task.wordRange[1]} words):\n${body.task.prompt}\nRequired points:\n${body.task.requirements.map((r) => "- " + r).join("\n")}\n\nCandidate's answer:\n"""\n${body.text.slice(0, 12000)}\n"""`;
  const result = await ask({ system: SYSTEM, messages: [{ role: "user", content: prompt }], effort: "medium", schema: SCHEMA });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  try {
    return Response.json(JSON.parse(result.text));
  } catch {
    return Response.json({ error: "Could not parse feedback" }, { status: 502 });
  }
}
