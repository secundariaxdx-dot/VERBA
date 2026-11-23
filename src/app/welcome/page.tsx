"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { EnglishVariety, Profile, Skill } from "@/domain/types";
import { useVerba } from "@/store/verba";
import { useHydrated } from "@/hooks/useHydrated";
import { LogoMark, Wordmark } from "@/components/ui/Logo";
import { Button, Chip, Field, inputCls, ProgressBar, cx } from "@/components/ui/primitives";
import { SKILL_LABEL, SKILLS, START_ABILITY } from "@/engine/levels";
import { buildDemoData } from "@/data/demo";
import { WEEKDAYS_SHORT, addDays, todayISO } from "@/lib/dates";

const MOTIVATIONS = ["Career and promotion", "Study at a university abroad", "Move to an English-speaking country", "Professional certification", "Personal challenge", "Teaching / academia"];

type Draft = Omit<Profile, "createdAt">;

const DEFAULT: Draft = {
  name: "",
  motivation: "",
  examDate: undefined,
  daysPerWeek: 5,
  studyDays: [1, 2, 3, 4, 5],
  minutesPerDay: 45,
  weakSkills: [],
  strongSkills: [],
  variety: "british",
  spanishSupport: "auto",
};

export default function Welcome() {
  const hydrated = useHydrated();
  const profile = useVerba((s) => s.profile);
  const complete = useVerba((s) => s.completeOnboarding);
  const setSkillScore = useVerba((s) => s.setSkillScore);
  const importData = useVerba((s) => s.importData);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(DEFAULT);
  // set when this page itself creates the profile, so it controls where to go next
  const leaving = useRef(false);

  useEffect(() => {
    if (hydrated && profile && !leaving.current) router.replace("/");
  }, [hydrated, profile, router]);

  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const toggle = (arr: Skill[], s: Skill) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]);

  function finish(toDiagnostic: boolean) {
    leaving.current = true;
    const p = { ...d, name: d.name.trim() || "Learner", daysPerWeek: d.studyDays.length };
    complete(p);
    // Seed estimates from the self-assessment; the diagnostic replaces them.
    for (const s of SKILLS) setSkillScore(s, p.weakSkills.includes(s) ? START_ABILITY - 4 : p.strongSkills.includes(s) ? START_ABILITY + 4 : START_ABILITY);
    router.replace(toDiagnostic ? "/diagnostic" : "/");
  }

  function demo() {
    leaving.current = true;
    importData(buildDemoData({ ...DEFAULT, name: "Pau", motivation: "Career and promotion", examDate: addDays(todayISO(), 120), weakSkills: ["writing", "speaking"], strongSkills: ["reading"] }));
    router.replace("/");
  }

  if (!hydrated || profile) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <LogoMark size={44} className="animate-pulse" />
      </div>
    );
  }

  const STEPS = 7;

  if (step === 0) {
    return (
      <div className="relative min-h-dvh overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 -left-40 h-[480px] w-[480px] rounded-full bg-sand blur-3xl" />
        <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-8">
          <Wordmark />
          <div className="grid flex-1 items-center gap-12 py-12 md:grid-cols-[1.2fr_1fr]">
            <div className="animate-rise">
              <div className="eyebrow mb-4">Cambridge C1 Advanced · Personal coach</div>
              <h1 className="text-[2.8rem] font-medium leading-[1.04] text-ink sm:text-[3.6rem]">
                Your personal path
                <br />
                to <em className="text-accent">fluency</em>.
              </h1>
              <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-2">
                VERBA measures where you really are in each skill, remembers every mistake, and builds a daily plan that takes you from B2 to C1 Advanced — at your pace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => setStep(1)}>
                  Set up my plan <ArrowRight size={17} />
                </Button>
                <Button size="lg" variant="secondary" onClick={demo}>
                  <Sparkles size={16} /> Explore with sample progress
                </Button>
              </div>
              <p className="mt-4 text-[13px] text-muted">Everything is stored on this device. No account needed.</p>
            </div>
            <div className="animate-rise hidden md:block" style={{ animationDelay: "120ms" }}>
              <div className="rounded-[28px] border border-line/70 bg-card p-7 shadow-[var(--shadow-lift)]">
                <div className="eyebrow mb-4">What VERBA tracks</div>
                {[
                  ["Reading", 82],
                  ["Use of English", 58],
                  ["Listening", 70],
                  ["Writing", 46],
                  ["Speaking", 50],
                ].map(([k, v]) => (
                  <div key={k} className="mb-3.5">
                    <div className="mb-1 flex justify-between text-[13px]">
                      <span className="text-ink-2">{k}</span>
                      <span className="text-muted">{Number(v) >= 80 ? "C1" : Number(v) >= 60 ? "B2+" : "B2"}</span>
                    </div>
                    <ProgressBar value={Number(v)} tone={Number(v) >= 80 ? "ok" : "accent"} />
                  </div>
                ))}
                <p className="mt-5 border-t border-line pt-4 font-display text-[15px] italic leading-relaxed text-ink-2">“Uneven skills are normal. VERBA stops drilling what you already master and spends your time where the marks are.”</p>
              </div>
            </div>
          </div>
          <div className="text-[12px] text-faint">Your English. Your pace. Your progress.</div>
        </div>
      </div>
    );
  }

  const canNext = step === 1 ? d.name.trim().length > 0 && d.motivation.trim().length > 0 : step === 3 ? d.studyDays.length > 0 : true;

  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-6">
        <div className="mb-8 flex items-center justify-between">
          <Wordmark />
          <span className="tabular text-[13px] text-muted">
            Step {step} of {STEPS}
          </span>
        </div>
        <ProgressBar value={step} max={STEPS} className="mb-10" label="Onboarding progress" />

        <div key={step} className="animate-rise flex-1">
          {step === 1 && (
            <>
              <h2 className="text-3xl text-ink">Let’s start with you.</h2>
              <p className="mt-2 text-muted">A few questions so the plan fits your life — not the other way round.</p>
              <div className="mt-8 space-y-6">
                <Field label="What should I call you?">
                  <input className={inputCls} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your first name" autoFocus />
                </Field>
                <div>
                  <div className="mb-2 text-[13px] font-medium text-ink-2">Why do you want C1 Advanced?</div>
                  <div className="flex flex-wrap gap-2">
                    {MOTIVATIONS.map((m) => (
                      <Chip key={m} active={d.motivation === m} onClick={() => set({ motivation: m })}>
                        {m}
                      </Chip>
                    ))}
                  </div>
                  <input className={cx(inputCls, "mt-3")} value={MOTIVATIONS.includes(d.motivation) ? "" : d.motivation} onChange={(e) => set({ motivation: e.target.value })} placeholder="…or in your own words" />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-3xl text-ink">Do you have an exam date?</h2>
              <p className="mt-2 text-muted">The plan sets monthly milestones backwards from this date. You can change it any time.</p>
              <div className="mt-8 space-y-4">
                <Field label="Target exam date" hint="Leave empty if you haven’t booked yet — I’ll plan for about 5 months.">
                  <input type="date" className={inputCls} min={todayISO()} value={d.examDate ?? ""} onChange={(e) => set({ examDate: e.target.value || undefined })} />
                </Field>
                <div className="flex flex-wrap gap-2">
                  {[8, 12, 16, 24].map((w) => (
                    <Chip key={w} active={d.examDate === addDays(todayISO(), w * 7)} onClick={() => set({ examDate: addDays(todayISO(), w * 7) })}>
                      In {w} weeks
                    </Chip>
                  ))}
                  <Chip active={!d.examDate} onClick={() => set({ examDate: undefined })}>
                    Not sure yet
                  </Chip>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-3xl text-ink">When can you study?</h2>
              <p className="mt-2 text-muted">Consistency beats intensity. Pick realistic days and a daily time you can keep.</p>
              <div className="mt-8">
                <div className="mb-2 text-[13px] font-medium text-ink-2">Study days</div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
                    <Chip key={dow} active={d.studyDays.includes(dow)} onClick={() => set({ studyDays: d.studyDays.includes(dow) ? d.studyDays.filter((x) => x !== dow) : [...d.studyDays, dow] })} className="w-14 justify-center">
                      {WEEKDAYS_SHORT[dow]}
                    </Chip>
                  ))}
                </div>
                <div className="mb-2 mt-8 text-[13px] font-medium text-ink-2">Minutes per day</div>
                <div className="flex flex-wrap gap-2">
                  {[20, 30, 45, 60, 90].map((m) => (
                    <Chip key={m} active={d.minutesPerDay === m} onClick={() => set({ minutesPerDay: m })}>
                      {m} min
                    </Chip>
                  ))}
                </div>
                <p className="mt-6 rounded-2xl bg-sand/60 p-4 text-[14px] text-ink-2">
                  That’s <strong className="text-ink">{Math.round((d.studyDays.length * d.minutesPerDay) / 6) / 10} hours a week</strong>.{" "}
                  {d.studyDays.length * d.minutesPerDay >= 240 ? "A strong pace for C1 in 4–6 months." : "Enough to make steady progress; consider a little more as the exam approaches."}
                </p>
              </div>
            </>
          )}

          {(step === 4 || step === 5) && (
            <>
              <h2 className="text-3xl text-ink">{step === 4 ? "Which skills feel weakest?" : "And your strongest?"}</h2>
              <p className="mt-2 text-muted">{step === 4 ? "Your impression is a starting point — the diagnostic will confirm or correct it." : "We’ll maintain these instead of over-practising them."}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {SKILLS.map((s) => {
                  const list = step === 4 ? d.weakSkills : d.strongSkills;
                  const other = step === 4 ? d.strongSkills : d.weakSkills;
                  return (
                    <Chip key={s} active={list.includes(s)} disabled={other.includes(s)} className="disabled:opacity-35" onClick={() => set(step === 4 ? { weakSkills: toggle(d.weakSkills, s) } : { strongSkills: toggle(d.strongSkills, s) })}>
                      {SKILL_LABEL[s]}
                    </Chip>
                  );
                })}
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h2 className="text-3xl text-ink">Your English, your way.</h2>
              <div className="mt-8 space-y-8">
                <div>
                  <div className="mb-2 text-[13px] font-medium text-ink-2">Preferred variety</div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["british", "British English"],
                        ["american", "American English"],
                        ["no-preference", "No preference"],
                      ] as [EnglishVariety, string][]
                    ).map(([v, l]) => (
                      <Chip key={v} active={d.variety === v} onClick={() => set({ variety: v })}>
                        {l}
                      </Chip>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted">Cambridge accepts both — just be consistent in your writing.</p>
                </div>
                <div>
                  <div className="mb-2 text-[13px] font-medium text-ink-2">Explanations in Spanish</div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["auto", "Adaptive (recommended)"],
                        ["more", "Always show Spanish"],
                        ["less", "On request only"],
                      ] as [Profile["spanishSupport"], string][]
                    ).map(([v, l]) => (
                      <Chip key={v} active={d.spanishSupport === v} onClick={() => set({ spanishSupport: v })}>
                        {l}
                      </Chip>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted">Adaptive: Spanish notes appear by default while you’re at B2, and step back as you approach C1.</p>
                </div>
              </div>
            </>
          )}

          {step === 7 && (
            <>
              <h2 className="text-3xl text-ink">Now let’s find your real level, {d.name.trim() || "there"}.</h2>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
                The diagnostic is adaptive: it starts at B2+ and gets harder or easier depending on your answers. It has seven short sections (grammar, vocabulary, Use of English, reading, listening, writing and speaking), about 4–8 minutes each.
              </p>
              <ul className="mt-5 space-y-2 text-[14.5px] text-ink-2">
                <li>• You can stop after any section and continue another day.</li>
                <li>• Each section gives you a level on its own — skills can be uneven.</li>
                <li>• Your study plan updates as soon as each section is done.</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => finish(true)}>
                  Start the diagnostic <ArrowRight size={17} />
                </Button>
                <Button size="lg" variant="secondary" onClick={() => finish(false)}>
                  Go to my dashboard first
                </Button>
              </div>
            </>
          )}
        </div>

        {step < 7 && (
          <div className="mt-10 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} /> Back
            </Button>
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        )}
        {step === 7 && (
          <div className="mt-10">
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} /> Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
