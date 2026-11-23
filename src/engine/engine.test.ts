import { describe, expect, it } from "vitest";
import { checkAnswer } from "./check";
import { review, newProgress } from "./srs";
import { updateAbility, weakTopics } from "./adaptive";
import { bandFor, percentToScale, progressToC1 } from "./levels";
import { evaluateWriting } from "./writingEval";
import { planForDay, recommendLesson } from "./planner";
import { WRITING_TASKS } from "@/data";
import { initialData } from "@/store/verba";
import { buildDemoData } from "@/data/demo";
import type { Question } from "@/domain/types";

const kwt: Question = { id: "t", skill: "useOfEnglish", topic: "inversion", level: "C1", kind: "transform", original: "I had never seen it.", keyword: "NEVER", prompt: "____ such a thing.", answers: ["never had i seen"], explanation: "" };

describe("answer checking", () => {
  it("is case/punctuation-insensitive and accepts contractions", () => {
    const q: Question = { ...kwt, answers: ["wouldn't have gone"], keyword: "HAVE" };
    expect(checkAnswer(q, "Would not have gone.").correct).toBe(true);
    expect(checkAnswer(q, "WOULDN’T HAVE GONE").correct).toBe(true);
  });
  it("warns when the key word is missing", () => {
    const r = checkAnswer(kwt, "i had not seen");
    expect(r.correct).toBe(false);
    expect(r.warning).toMatch(/key word/);
  });
});

describe("spaced repetition", () => {
  it("grows intervals on success and shrinks them on lapses", () => {
    let p = newProgress("w", true);
    p = review(p, 4, "2026-01-01");
    p = review(p, 4, "2026-01-02");
    p = review(p, 4, "2026-01-08");
    expect(p.interval).toBeGreaterThan(6);
    const lapsed = review(p, 0, "2026-01-20");
    expect(lapsed.interval).toBe(1);
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.ease).toBeLessThan(p.ease);
  });
  it("marks repeatedly forgotten words as difficult", () => {
    let p = newProgress("w", true);
    p = review(p, 0);
    p = review(p, 0);
    expect(p.difficult).toBe(true);
  });
});

describe("adaptive model", () => {
  it("raises ability after correct hard items and lowers it after easy misses", () => {
    expect(updateAbility(172, "C1+", true, 0)).toBeGreaterThan(172);
    expect(updateAbility(172, "B2", false, 0)).toBeLessThan(172);
  });
  it("maps scores to bands", () => {
    expect(bandFor(165).label).toBe("B2");
    expect(bandFor(177).label).toBe("Approaching C1");
    expect(bandFor(185).label).toBe("C1");
    expect(progressToC1(170)).toBe(50);
    expect(percentToScale(60)).toBe(180);
  });
  it("ranks repeated mistakes as weak topics", () => {
    const d = buildDemoData({ ...initialData().profile!, name: "T", motivation: "", daysPerWeek: 5, studyDays: [1, 2, 3, 4, 5], minutesPerDay: 45, weakSkills: [], strongSkills: [], variety: "british", spanishSupport: "auto" } as never);
    const w = weakTopics(d.attempts, Object.values(d.mistakes));
    expect(w.length).toBeGreaterThan(0);
    expect(w[0].weight).toBeGreaterThan(0);
  });
});

describe("planner", () => {
  const profile = { name: "T", motivation: "", daysPerWeek: 5, studyDays: [1, 2, 3, 4, 5], minutesPerDay: 45, weakSkills: [], strongSkills: [], variety: "british" as const, spanishSupport: "auto" as const, createdAt: "" };
  it("respects rest days and the daily time budget", () => {
    const d = { ...initialData(), profile };
    expect(planForDay(d, "2026-11-29").isStudyDay).toBe(false); // Sunday
    const p = planForDay(d, "2026-11-24");
    expect(p.blocks.length).toBeGreaterThan(1);
    expect(p.minutes).toBeLessThanOrEqual(45 + 15);
  });
  it("stops recommending B2 drills for a skill already at C1", () => {
    const d = { ...initialData(), profile };
    for (const k of Object.keys(d.levels) as (keyof typeof d.levels)[]) d.levels[k] = { ...d.levels[k], score: 190 };
    expect(["C1", "C1+"]).toContain(recommendLesson(d).lesson.level);
  });
});

describe("writing evaluator", () => {
  it("flags typical Spanish-speaker errors and contractions in formal tasks", () => {
    const task = WRITING_TASKS.find((t) => t.register === "formal") ?? WRITING_TASKS[0];
    const fb = evaluateWriting("In my opinion it depends of many things.\n\nPeople is worried and we can't discuss about it.\n\nIn the other hand, informations are important.", task);
    const originals = fb.corrections.map((c) => c.original.toLowerCase());
    expect(originals).toEqual(expect.arrayContaining(["depends of", "people is", "discuss about", "in the other hand", "informations"]));
    expect(fb.scaleScore).toBeLessThan(180);
  });
  it("rates the model answer higher than a weak draft", () => {
    const t = WRITING_TASKS[0];
    const good = evaluateWriting(t.modelAnswer, t);
    const weak = evaluateWriting("I think it is good. People is happy. It is very important thing for a lot of people and I think it is good.", t);
    expect(good.scaleScore).toBeGreaterThan(weak.scaleScore);
  });
});
