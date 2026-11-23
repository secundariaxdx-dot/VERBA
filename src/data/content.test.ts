import { describe, expect, it } from "vitest";
import { allQuestions, LESSONS, LISTENING, READING, VOCABULARY, WRITING_TASKS, SPEAKING_TASKS, USE_OF_ENGLISH, GRAMMAR, vocabQuestion } from "@/data";
import { checkAnswer } from "@/engine/check";
import { wordCount } from "@/lib/text";

describe("content banks", () => {
  const qs = allQuestions();
  it("has unique question ids", () => {
    const ids = qs.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("mcq answers are among options and options are unique", () => {
    for (const q of qs.filter((q) => q.kind === "mcq")) {
      expect(q.options, q.id).toBeDefined();
      expect(q.options!.includes(q.answers[0]), q.id).toBe(true);
      expect(new Set(q.options).size, q.id).toBe(q.options!.length);
    }
  });
  it("gap/transform prompts contain exactly one gap and their answers self-check", () => {
    for (const q of qs.filter((q) => q.kind !== "mcq")) {
      expect(q.prompt.split("____").length - 1, q.id).toBe(1);
      for (const a of q.answers) expect(checkAnswer(q, a).correct, `${q.id}: ${a}`).toBe(true);
    }
  });
  it("listening gap answers appear in the script", () => {
    for (const t of LISTENING) {
      const script = t.segments.map((s) => s.text).join(" ").toLowerCase().replace(/’/g, "'");
      for (const q of t.questions.filter((q) => q.kind === "gap")) expect(script.includes(q.answers[0].toLowerCase()), q.id).toBe(true);
    }
  });
  it("has the expected volume", () => {
    expect(USE_OF_ENGLISH.length).toBeGreaterThanOrEqual(60);
    expect(GRAMMAR.length).toBeGreaterThanOrEqual(30);
    expect(READING.length).toBeGreaterThanOrEqual(6);
    expect(LISTENING.length).toBeGreaterThanOrEqual(5);
    expect(VOCABULARY.length).toBeGreaterThanOrEqual(60);
    expect(LESSONS.length).toBeGreaterThanOrEqual(12);
    expect(WRITING_TASKS.length).toBeGreaterThanOrEqual(6);
    expect(SPEAKING_TASKS.length).toBeGreaterThanOrEqual(8);
  });
  it("vocab ids unique and generated questions valid", () => {
    expect(new Set(VOCABULARY.map((v) => v.id)).size).toBe(VOCABULARY.length);
    for (const v of VOCABULARY) {
      const q = vocabQuestion(v);
      expect(q.options!.length, v.id).toBe(4);
      expect(new Set(q.options).size, v.id).toBe(4);
    }
  });
  it("writing model answers are within range-ish", () => {
    for (const t of WRITING_TASKS) {
      const n = wordCount(t.modelAnswer);
      expect(n, t.id).toBeGreaterThan(t.wordRange[0] - 25);
      expect(t.contentKeywords.length, t.id).toBe(t.requirements.length);
    }
  });
});
