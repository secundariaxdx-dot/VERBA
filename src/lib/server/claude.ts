import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only Claude helper. The API key is read from the server environment
 * (ANTHROPIC_API_KEY) and never reaches the browser. Without a key every
 * route answers 503 and the client falls back to VERBA's local engines.
 */
export const MODEL = "claude-opus-5-5";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export interface AskOptions {
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
  /** JSON schema for structured output. */
  schema?: Record<string, unknown>;
}

export type AskResult = { ok: true; text: string } | { ok: false; status: number; error: string };

export async function ask(opts: AskOptions): Promise<AskResult> {
  try {
    const params = {
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      system: opts.system,
      messages: opts.messages,
      output_config: {
        effort: opts.effort ?? "medium",
        ...(opts.schema ? { format: { type: "json_schema", schema: opts.schema } } : {}),
      },
      // Server-side refusal fallback: if a safety classifier declines, the API
      // re-runs the request on a suitable fallback model inside the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    };
    const response = (await getClient().beta.messages.create(
      params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming,
    )) as Anthropic.Beta.BetaMessage;
    if (response.stop_reason === "refusal") return { ok: false, status: 422, error: "The tutor declined this request." };
    const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return { ok: true, text };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, status: 401, error: "Invalid ANTHROPIC_API_KEY on the server." };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, status: 429, error: "Rate limited — try again in a moment." };
    if (e instanceof Anthropic.APIError) return { ok: false, status: e.status ?? 502, error: e.message };
    return { ok: false, status: 502, error: "AI request failed." };
  }
}
