// End-to-end smoke test of VERBA's main workflows on a fresh profile.
// Usage: start the app (npm run dev), then: npm run e2e  [BASE_URL defaults to http://localhost:3100]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = await import("playwright"));
}

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const errors = [];
const ok = (m) => console.log("  ✓", m);
function assert(c, m) {
  if (!c) throw new Error("Assertion failed: " + m);
  ok(m);
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
const state = () => page.evaluate(() => JSON.parse(localStorage.getItem("verba-v1") ?? "{}").state ?? {});

try {
  console.log("Onboarding");
  await page.goto(BASE + "/");
  await page.waitForURL(/welcome/, { waitUntil: "commit" });
  await page.getByRole("button", { name: /Set up my plan/ }).click();
  await page.getByPlaceholder("Your first name").fill("Ana");
  await page.getByRole("button", { name: "Career and promotion" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: "In 16 weeks" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: "60 min" }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: "Writing", exact: true }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: "Reading", exact: true }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Start the diagnostic/ }).click();
  await page.waitForURL(/diagnostic/, { waitUntil: "commit" });
  let s = await state();
  assert(s.profile?.name === "Ana" && s.profile.minutesPerDay === 60, "profile saved");

  console.log("Diagnostic (grammar section, adaptive)");
  await page.getByRole("button", { name: "Start" }).first().click();
  for (let i = 0; i < 8; i++) {
    await page.getByText(`Question ${i + 1} of 8`).waitFor();
    const option = page.locator("button:has(span.rounded-full)").filter({ hasText: /\w/ }).first();
    const input = page.getByLabel("Your answer");
    if (await input.count()) {
      await input.fill("the");
      await page.getByRole("button", { name: "Check answer" }).click();
    } else await option.click();
  }
  await page.getByText(/Grammar result/).waitFor();
  s = await state();
  assert(s.diagnostic.completed.grammar?.total === 8, "grammar section scored and saved");
  await page.getByRole("button", { name: /Back to the diagnostic/ }).click();

  console.log("Dashboard");
  await page.goto(BASE + "/");
  await page.getByText(/Good (morning|afternoon|evening), Ana/).waitFor();
  assert(await page.getByText("Today’s lesson").isVisible(), "dashboard shows today's lesson");

  console.log("Daily lesson (full flow)");
  await page.getByRole("link", { name: /Start lesson|Retake lesson/ }).click();
  await page.waitForURL(/lessons\?id=/, { waitUntil: "commit" });
  await page.getByRole("button", { name: /See examples/ }).click();
  await page.getByRole("button", { name: /Practise/ }).click();
  async function answerAll() {
    for (let k = 0; k < 12; k++) {
      const res = page.getByRole("button", { name: /See results|Next question/ });
      await page.waitForTimeout(150);
      // stop when no question is on screen any more (results or the next lesson step)
      if (!(await page.getByText(/^\d+ \/ \d+$/).count())) return;
      const input = page.getByLabel("Your answer");
      if (await input.count()) {
        await input.fill("wrong answer");
        await page.getByRole("button", { name: "Check answer" }).click();
      } else {
        await page.locator("button.rounded-xl.border").first().click();
      }
      await res.click();
    }
  }
  await answerAll();
  await page.getByRole("button", { name: /Vocabulary notes/ }).click();
  await page.getByRole("button", { name: /Take the mini-test/ }).click();
  await answerAll();
  await page.getByText("Lesson complete").waitFor();
  s = await state();
  assert(Object.keys(s.lessonsDone).length === 1, "lesson completion saved");
  assert(Object.keys(s.mistakes).length > 0, "wrong answers saved to My Mistakes");
  assert(s.sessions.some((x) => x.activity === "lesson"), "study session logged");

  console.log("Use of English");
  await page.goto(BASE + "/use-of-english");
  await page.getByRole("button", { name: /Start set/ }).click();
  await answerAll();
  s = await state();
  assert(s.sessions.some((x) => x.activity === "use-of-english"), "UoE set scored and logged");

  console.log("Vocabulary");
  await page.goto(BASE + "/vocabulary");
  await page.getByRole("button", { name: "Save word" }).first().click();
  await page.getByRole("button", { name: "Save word" }).first().click();
  await page.getByRole("tab", { name: /Flashcards/ }).click();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: "Forgot" }).click();
  s = await state();
  const saved = Object.values(s.vocab).filter((v) => v.saved);
  assert(saved.length >= 2, "words saved");
  assert(saved.some((v) => v.lapses === 1), "flashcard review scheduled (SM-2)");

  console.log("Writing");
  await page.goto(BASE + "/writing?id=wr-01");
  const essay = Array.from({ length: 5 }, (_, i) => `Paragraph ${i + 1}. In my opinion the society depend of technology a lot of. However, people is very important and we must discuss about it. Moreover, it is crucial to consider the long-term consequences, whereas the short-term benefits are obvious.`).join("\n\n");
  await page.getByLabel("Your answer").fill(essay);
  await page.getByRole("button", { name: /Submit for feedback/ }).click();
  await page.getByText("Estimated level").waitFor();
  assert(await page.getByText("depend of").first().isVisible(), "writing feedback flags a typical Spanish-speaker error");
  s = await state();
  assert(s.writing.some((w) => w.status === "submitted" && w.feedback), "writing submission saved with feedback");

  console.log("Reading");
  await page.goto(BASE + "/reading?id=rd-03");
  await page.getByRole("button", { name: "Start reading" }).click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /finished reading/ }).click();
  await answerAll();
  s = await state();
  assert(s.sessions.some((x) => x.activity === "reading"), "reading text scored and logged");

  console.log("Listening");
  await page.goto(BASE + "/listening?id=ls-01");
  await page.locator("h2").first().waitFor();
  assert((await page.getByRole("button", { name: "Play" }).count()) + (await page.getByText(/no text-to-speech voices/).count()) > 0, "player or no-voices fallback shown");

  console.log("Speaking (typed fallback)");
  await page.goto(BASE + "/speaking?id=sp-09");
  await page.getByRole("button", { name: /^Type/ }).click();
  await page.getByRole("button", { name: /Start speaking|preparation/ }).click();
  if (await page.getByRole("button", { name: /Skip preparation/ }).count()) await page.getByRole("button", { name: /Skip preparation/ }).click();
  await page.getByPlaceholder("Type your spoken answer…").fill("Well, I'd say that on balance technology has made us more connected, whereas in the long run it might isolate people. That said, it depends on how we use it, and to a certain extent the responsibility lies with each of us.");
  await page.getByRole("button", { name: "Stop" }).click();
  await page.getByRole("button", { name: "Get feedback" }).click();
  await page.getByText(/Estimated level/).waitFor();
  s = await state();
  assert(s.speaking.length === 1 && s.speaking[0].feedback, "speaking session analysed and saved");

  console.log("Mock exam (listening paper, exam mode)");
  await page.goto(BASE + "/mock-exams");
  await page.getByRole("button", { name: /Start timed/ }).nth(3).click();
  for (let k = 0; k < 14; k++) {
    if (await page.getByText("Mock exam report").count()) break;
    const input = page.getByLabel("Your answer");
    if (await input.count()) {
      await input.fill("x");
      await page.getByRole("button", { name: "Check answer" }).click();
    } else await page.locator("button.rounded-xl.border").first().click();
    await page.waitForTimeout(120);
  }
  await page.getByText("Mock exam report").waitFor();
  s = await state();
  assert(s.mocks.length === 1 && s.mocks[0].papers[0].total === 12, "mock scored, report generated, result saved");

  console.log("Tutor (offline)");
  await page.goto(BASE + "/tutor");
  await page.getByRole("button", { name: "Why is my last answer incorrect?" }).click();
  await page.getByText(/Your most recent mistake/).waitFor();
  ok("tutor explains the last mistake");

  console.log("Persistence");
  await page.reload();
  await page.goto(BASE + "/mistakes");
  await page.getByText("Every error is a lesson").waitFor();
  assert((await page.locator("li").filter({ hasText: "→" }).count()) > 0, "mistakes persist after reload");
  await page.goto(BASE + "/statistics");
  await page.getByText("Your progress, measured").waitFor();
  ok("statistics render");

  for (const p of ["/plan", "/reading", "/listening", "/speaking", "/mock-exams", "/settings"]) {
    await page.goto(BASE + p);
    await page.locator("h1").first().waitFor();
  }
  ok("all remaining pages render");

  if (errors.length) throw new Error("Page errors:\n" + errors.join("\n"));
  console.log("\nAll workflows passed.");
} catch (e) {
  console.error("\n✗", e.message);
  await page.screenshot({ path: "e2e-failure.png", fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
