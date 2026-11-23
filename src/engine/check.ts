import type { Question } from "@/domain/types";
import { expandContractions, normalizeAnswer } from "@/lib/text";

export interface CheckResult {
  correct: boolean;
  /** The canonical answer to show. */
  expected: string;
  /** For transformations: the answer used the key word but changed it, or exceeded 6 words. */
  warning?: string;
}

function variants(s: string): string[] {
  const n = normalizeAnswer(s);
  return [n, expandContractions(n)];
}

export function checkAnswer(q: Question, raw: string): CheckResult {
  const expected = q.answers[0] ?? "";
  if (q.kind === "mcq") return { correct: raw === expected, expected };

  const given = variants(raw);
  const ok = q.answers.some((a) => {
    const acc = variants(a);
    return acc.some((x) => given.includes(x));
  });

  let warning: string | undefined;
  if (q.kind === "transform") {
    const words = normalizeAnswer(raw).split(" ").filter(Boolean);
    const kw = q.keyword?.toLowerCase();
    const kwInPrompt = kw ? q.prompt.toLowerCase().replace("____", " ").split(/\W+/).includes(kw) : true;
    if (kw && !kwInPrompt && !normalizeAnswer(raw).split(" ").includes(kw))
      warning = `Remember: you must use the key word “${q.keyword}” without changing it.`;
    else if (words.length > 6) warning = "C1 transformations allow 3–6 words (contractions count as two).";
    else if (words.length < 2) warning = "Your answer is too short — transformations need 3–6 words.";
  }
  return { correct: ok, expected, warning: ok ? undefined : warning };
}
