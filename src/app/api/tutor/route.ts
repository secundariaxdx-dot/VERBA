import type Anthropic from "@anthropic-ai/sdk";
import { aiEnabled, ask } from "@/lib/server/claude";

interface Body {
  context: string;
  history: { role: "user" | "tutor"; text: string }[];
  message: string;
}

const SYSTEM = `You are VERBA, a personal English tutor preparing an adult Spanish speaker for Cambridge C1 Advanced (CAE).

Tone: intelligent, supportive, adult and direct. Encouraging without being childish or over-enthusiastic. No emojis.

How you teach:
- Explain the rule briefly, then show 2–3 examples. Prefer teaching over rewriting: when correcting the learner's text, point out the issue and let them fix it, then show a model only if useful.
- Use Spanish only when the learner asks or when a contrast with Spanish clarifies a typical error (false friends, articles, prepositions). As the learner's level rises, answer in English.
- When asked for practice questions, write ORIGINAL Cambridge-style items (never copy real exam papers) and put the answer key at the end, separated by a line "Answers:".
- Use what you know about the learner (below) to personalise: refer to their weak topics, recent mistakes and plan when relevant.
- Never present your estimates as official Cambridge scores.
- Keep answers focused: usually under 250 words unless the learner asks for more. Light markdown (**bold**, short lists) is fine.

Learner profile:
`;

export async function POST(req: Request) {
  if (!aiEnabled()) return Response.json({ error: "AI tutor not configured" }, { status: 503 });
  const body = (await req.json()) as Body;
  if (typeof body.message !== "string" || !body.message.trim()) return Response.json({ error: "Empty message" }, { status: 400 });

  const history: Anthropic.MessageParam[] = (body.history ?? [])
    .slice(-12)
    .map((m) => ({ role: m.role === "tutor" ? ("assistant" as const) : ("user" as const), content: m.text.slice(0, 6000) }));
  // the API needs the first message to be from the user
  while (history.length && history[0].role !== "user") history.shift();

  const result = await ask({
    system: SYSTEM + String(body.context ?? "").slice(0, 6000),
    messages: [...history, { role: "user", content: body.message.slice(0, 8000) }],
    effort: "medium",
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ reply: result.text });
}
