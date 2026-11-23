"use client";
import { useRef, useState } from "react";
import { BookmarkPlus, Check, Timer } from "lucide-react";
import type { ReadingText } from "@/domain/types";
import { useVerba } from "@/store/verba";
import { QuizRunner, type QuizResult } from "@/components/exercise/QuizRunner";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { wordCount } from "@/lib/text";

export function ReadingTask({ text, mode = "learning", source = "reading", log = true, onFinish }: { text: ReadingText; mode?: "learning" | "exam"; source?: "reading" | "diagnostic" | "mock"; log?: boolean; onFinish?: (r: QuizResult, wpm: number | null) => void }) {
  const [phase, setPhase] = useState<"intro" | "reading" | "questions">("intro");
  const [wpm, setWpm] = useState<number | null>(null);
  const started = useRef(0);
  const logReadingSpeed = useVerba((s) => s.logReadingSpeed);
  const addCustomWord = useVerba((s) => s.addCustomWord);
  const customVocab = useVerba((s) => s.customVocab);
  const words = wordCount(text.paragraphs.join(" "));

  function doneReading() {
    const minutes = (Date.now() - started.current) / 60000;
    const w = Math.round(words / Math.max(minutes, 0.2));
    const plausible = w > 40 && w < 900; // ignore skimming or idle tabs
    if (plausible) {
      setWpm(w);
      if (source === "reading") logReadingSpeed(text.id, w);
    }
    setPhase("questions");
  }

  function saveGloss(term: string, gloss: string) {
    addCustomWord({
      term,
      pos: "phrase",
      definition: gloss,
      spanish: "",
      example: text.paragraphs.find((p) => p.toLowerCase().includes(term.toLowerCase()))?.split(/(?<=[.!?])\s/).find((s) => s.toLowerCase().includes(term.toLowerCase())) ?? "",
      synonyms: [],
      collocations: [],
      register: "neutral",
      level: text.level,
      category: "c1",
      topic: text.theme,
    });
  }

  if (phase === "intro") {
    return (
      <Card className="p-7 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent-50 text-accent">
          <Timer size={20} />
        </div>
        <h2 className="text-2xl text-ink">{text.title}</h2>
        <p className="mx-auto mt-2 max-w-md text-[14.5px] text-muted">
          {words} words · {text.genre} · {text.level}. Read at your normal pace — VERBA measures your reading speed — then answer {text.questions.length} questions with the text still visible.
        </p>
        <Button
          size="lg"
          className="mt-6"
          onClick={() => {
            started.current = Date.now();
            setPhase("reading");
          }}
        >
          Start reading
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <Card className="p-6 sm:p-8 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="accent">{text.genre}</Badge>
          <Badge tone="neutral">{text.level}</Badge>
          {wpm && <Badge tone="outline">{wpm} words/min</Badge>}
        </div>
        <h2 className="mb-5 text-[1.7rem] leading-tight text-ink">{text.title}</h2>
        <div className="prose-verba font-display text-[17px] text-ink-2">
          {text.paragraphs.map((p, i) => (
            <p key={i}>
              <span className="mr-2 font-sans text-[11px] font-semibold text-faint">{i + 1}</span>
              {p}
            </p>
          ))}
        </div>
        {phase === "reading" && (
          <div className="sticky bottom-0 -mx-2 mt-4 bg-gradient-to-t from-card via-card to-transparent px-2 pt-6">
            <Button size="lg" onClick={doneReading} className="w-full sm:w-auto">
              <Check size={16} /> I’ve finished reading
            </Button>
          </div>
        )}
        {phase === "questions" && mode === "learning" && text.glossary.length > 0 && (
          <div className="mt-6 border-t border-line pt-5">
            <div className="eyebrow mb-3">Glossary — save the words you didn’t know</div>
            <ul className="space-y-2">
              {text.glossary.map((g) => {
                const saved = customVocab.some((c) => c.term.toLowerCase() === g.term.toLowerCase());
                return (
                  <li key={g.term} className="flex items-start justify-between gap-3 text-[14px]">
                    <span>
                      <strong className="text-ink">{g.term}</strong> <span className="text-muted">— {g.gloss}</span>
                    </span>
                    <button onClick={() => !saved && saveGloss(g.term, g.gloss)} disabled={saved} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-2 hover:border-accent disabled:border-ok/40 disabled:text-ok">
                      {saved ? <Check size={12} /> : <BookmarkPlus size={12} />} {saved ? "Saved" : "Save"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>
      <div>
        {phase === "questions" ? (
          <Card className="p-5 sm:p-7 lg:sticky lg:top-8">
            <QuizRunner questions={text.questions} source={source === "mock" ? "mock" : source} title={`Reading: ${text.title}`} skill="reading" activity="reading" mode={mode} log={log} planBlock={source === "reading" ? "skill:reading" : undefined} onFinish={(r) => onFinish?.(r, wpm)} />
          </Card>
        ) : (
          <Card className="p-6 text-[14px] text-muted">Questions appear when you finish reading. Take your time — understanding matters more than speed.</Card>
        )}
      </div>
    </div>
  );
}
