"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, BookmarkCheck, ChevronDown, Plus, Search, Trash2, Volume2 } from "lucide-react";
import type { VocabCategory, VocabEntry, Level } from "@/domain/types";
import { VOCABULARY, vocabQuestion } from "@/data";
import { useVerba } from "@/store/verba";
import { isDue } from "@/engine/srs";
import { Badge, Button, Card, Chip, Empty, Field, PageHeader, Segmented, Stat, inputCls, cx } from "@/components/ui/primitives";
import { QuizRunner } from "@/components/exercise/QuizRunner";
import { loadVoices, pickVoice, ttsSupported } from "@/lib/speech";
import { minutesSince, now, shuffle, todayISO } from "@/lib/dates";

const CATS: { value: VocabCategory; label: string }[] = [
  { value: "academic", label: "Academic" },
  { value: "c1", label: "C1 vocabulary" },
  { value: "collocation", label: "Collocations" },
  { value: "phrasal-verb", label: "Phrasal verbs" },
  { value: "idiom", label: "Idioms" },
  { value: "formal", label: "Formal" },
  { value: "informal", label: "Informal" },
  { value: "word-formation", label: "Word formation" },
  { value: "confusing-words", label: "Confusing words" },
  { value: "topic", label: "Topic vocabulary" },
];

async function speak(text: string, variety?: string) {
  if (!ttsSupported()) return;
  const voices = await loadVoices();
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = variety === "american" ? "en-US" : "en-GB";
  const v = pickVoice(voices, u.lang);
  if (v) u.voice = v;
  u.rate = 0.92;
  speechSynthesis.speak(u);
}

type Tab = "browse" | "review" | "quiz" | "add";

export default function Page() {
  return (
    <Suspense>
      <Vocabulary />
    </Suspense>
  );
}

function Vocabulary() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get("mode") === "review" ? "review" : "browse");
  const vocab = useVerba((s) => s.vocab);
  const custom = useVerba((s) => s.customVocab);
  const all = useMemo(() => [...custom, ...VOCABULARY], [custom]);
  const saved = Object.values(vocab).filter((v) => v.saved);
  const today = todayISO();
  const due = saved.filter((v) => isDue(v, today));
  const difficult = saved.filter((v) => v.difficult);
  const retained = saved.filter((v) => v.repetitions >= 2);

  return (
    <div>
      <PageHeader eyebrow="Vocabulary" title="Your personal word bank" subtitle="Save words, add your own examples, and review them with spaced repetition. Words you forget come back more often until they stick." />
      <Card className="mb-6 grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
        <Stat label="Saved" value={saved.length} hint={`of ${all.length} in the bank`} />
        <Stat label="Due today" value={due.length} hint="flashcards to review" />
        <Stat label="Retained" value={retained.length} hint="reviewed successfully 2+ times" />
        <Stat label="Difficult" value={difficult.length} hint="forgotten repeatedly" />
      </Card>
      <Segmented
        value={tab}
        onChange={setTab}
        className="mb-6"
        options={[
          { value: "browse", label: "Browse" },
          { value: "review", label: `Flashcards${due.length ? ` · ${due.length}` : ""}` },
          { value: "quiz", label: "Quiz" },
          { value: "add", label: "Add word" },
        ]}
      />
      {tab === "browse" && <Browse all={all} />}
      {tab === "review" && <Flashcards all={all} onBrowse={() => setTab("browse")} />}
      {tab === "quiz" && <Quiz all={all} />}
      {tab === "add" && <AddWord onDone={() => setTab("browse")} />}
    </div>
  );
}

function Browse({ all }: { all: VocabEntry[] }) {
  const vocab = useVerba((s) => s.vocab);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<VocabCategory | "all">("all");
  const [level, setLevel] = useState<Level | "all">("all");
  const [only, setOnly] = useState<"all" | "saved" | "difficult">("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = all.filter((e) => {
    const p = vocab[e.id];
    if (only === "saved" && !p?.saved) return false;
    if (only === "difficult" && !p?.difficult) return false;
    if (cat !== "all" && e.category !== cat) return false;
    if (level !== "all" && e.level !== level) return false;
    if (q) {
      const s = q.toLowerCase();
      return e.term.toLowerCase().includes(s) || e.definition.toLowerCase().includes(s) || e.spanish.toLowerCase().includes(s) || e.synonyms.some((x) => x.toLowerCase().includes(s));
    }
    return true;
  });
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input className={cx(inputCls, "pl-10")} placeholder="Search words, meanings, Spanish, synonyms…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="h-11 rounded-xl border border-line bg-paper px-3 pr-8 text-[14px] text-ink focus:border-accent focus:outline-none" value={cat} onChange={(e) => setCat(e.target.value as VocabCategory | "all")} aria-label="Category">
            <option value="all">All categories</option>
            {CATS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select className="h-11 rounded-xl border border-line bg-paper px-3 pr-8 text-[14px] text-ink focus:border-accent focus:outline-none" value={level} onChange={(e) => setLevel(e.target.value as Level | "all")} aria-label="Level">
            <option value="all">All levels</option>
            {["B2", "B2+", "C1", "C1+"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "saved", "difficult"] as const).map((o) => (
          <Chip key={o} active={only === o} onClick={() => setOnly(o)}>
            {o === "all" ? "All words" : o === "saved" ? "My saved words" : "Difficult words"}
          </Chip>
        ))}
        <span className="self-center text-[12.5px] text-muted">{list.length} results</span>
      </div>
      {list.length === 0 ? (
        <Empty title="No words match">Try another filter, or add your own word.</Empty>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((e) => (
            <EntryCard key={e.id} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryCard({ e, open, onToggle }: { e: VocabEntry; open: boolean; onToggle: () => void }) {
  const p = useVerba((s) => s.vocab[e.id]);
  const save = useVerba((s) => s.saveWord);
  const unsave = useVerba((s) => s.unsaveWord);
  const setEx = useVerba((s) => s.setPersonalExample);
  const del = useVerba((s) => s.deleteCustomWord);
  const variety = useVerba((s) => s.profile?.variety);
  const [ex, setExDraft] = useState(p?.personalExample ?? "");
  const isCustom = e.id.startsWith("custom");
  return (
    <Card className={cx("p-4 transition", open && "md:col-span-2")}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-[18px] text-ink">{e.term}</span>
            {e.ipa && <span className="text-[13px] text-muted">{e.ipa}</span>}
            <span className="text-[12px] italic text-faint">{e.pos}</span>
          </div>
          <p className={cx("mt-0.5 text-[13.5px] text-ink-2", !open && "line-clamp-1")}>{e.definition}</p>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => speak(e.term, variety)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink" aria-label={`Pronounce ${e.term}`}>
            <Volume2 size={16} />
          </button>
          <button onClick={() => (p?.saved ? unsave(e.id) : save(e.id))} className={cx("grid h-8 w-8 place-items-center rounded-full hover:bg-sand", p?.saved ? "text-accent" : "text-muted")} aria-label={p?.saved ? "Remove from my words" : "Save word"}>
            {p?.saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
          </button>
          <button onClick={onToggle} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-sand" aria-label="Details">
            <ChevronDown size={16} className={cx("transition", open && "rotate-180")} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone="neutral">{e.level}</Badge>
        <Badge tone="outline">{CATS.find((c) => c.value === e.category)?.label ?? e.category}</Badge>
        <Badge tone="outline">{e.register}</Badge>
        {p?.difficult && <Badge tone="bad">Difficult</Badge>}
      </div>
      {open && (
        <div className="animate-rise mt-4 grid gap-4 border-t border-line pt-4 text-[14px] md:grid-cols-2">
          <div className="space-y-3">
            {e.spanish && (
              <div>
                <div className="eyebrow mb-0.5">En español</div>
                <p className="text-ink-2">{e.spanish}</p>
              </div>
            )}
            {e.example && (
              <div>
                <div className="eyebrow mb-0.5">Example</div>
                <p className="font-display italic text-ink-2">“{e.example}”</p>
              </div>
            )}
            {e.collocations.length > 0 && (
              <div>
                <div className="eyebrow mb-0.5">Collocations</div>
                <p className="text-ink-2">{e.collocations.join(" · ")}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {e.synonyms.length > 0 && (
              <div>
                <div className="eyebrow mb-0.5">Synonyms</div>
                <p className="text-ink-2">{e.synonyms.join(", ")}</p>
              </div>
            )}
            {e.antonyms && e.antonyms.length > 0 && (
              <div>
                <div className="eyebrow mb-0.5">Antonyms</div>
                <p className="text-ink-2">{e.antonyms.join(", ")}</p>
              </div>
            )}
            <div>
              <div className="eyebrow mb-1">My example</div>
              <div className="flex gap-2">
                <input className={cx(inputCls, "h-10 text-[14px]")} value={ex} onChange={(ev) => setExDraft(ev.target.value)} placeholder="Write your own sentence with it…" />
                <Button size="sm" variant="quiet" className="h-10" onClick={() => setEx(e.id, ex)} disabled={!ex.trim() || ex === p?.personalExample}>
                  Save
                </Button>
              </div>
              {p?.personalExample && <p className="mt-1 text-[12.5px] text-ok">Saved: “{p.personalExample}”</p>}
            </div>
            {p && (
              <p className="text-[12px] text-muted">
                Next review {p.due} · interval {p.interval} day{p.interval === 1 ? "" : "s"} · forgotten {p.lapses}×
              </p>
            )}
            {isCustom && (
              <button onClick={() => del(e.id)} className="inline-flex items-center gap-1 text-[12.5px] text-bad">
                <Trash2 size={13} /> Delete this word
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Flashcards({ all, onBrowse }: { all: VocabEntry[]; onBrowse: () => void }) {
  const vocab = useVerba((s) => s.vocab);
  const reviewWord = useVerba((s) => s.reviewWord);
  const logSession = useVerba((s) => s.logSession);
  const markBlock = useVerba((s) => s.markBlock);
  const variety = useVerba((s) => s.profile?.variety);
  const [practiceDifficult, setPracticeDifficult] = useState(false);
  // freeze the queue at the start of the session
  const [queue] = useState(() =>
    Object.values(vocab)
      .filter((v) => isDue(v, todayISO()))
      .sort((a, b) => b.lapses - a.lapses || a.due.localeCompare(b.due))
      .map((v) => v.entryId),
  );
  const [extra, setExtra] = useState<string[]>([]);
  const list = practiceDifficult ? extra : queue;
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [startedAt] = useState(now);

  const id = list[i];
  const e = all.find((x) => x.id === id);

  function grade(g: 0 | 3 | 4 | 5) {
    reviewWord(id, g);
    setReviewed((n) => n + 1);
    setFlipped(false);
    if (i + 1 >= list.length) {
      logSession({ minutes: minutesSince(startedAt), activity: "vocabulary", skill: "vocabulary", title: "Flashcard review" });
      markBlock(todayISO(), "review", "done");
    }
    setI(i + 1);
  }

  if (!e) {
    const difficultIds = Object.values(vocab).filter((v) => v.saved && v.difficult).map((v) => v.entryId);
    return (
      <Empty
        title={reviewed ? `Done — ${reviewed} card${reviewed > 1 ? "s" : ""} reviewed` : "Nothing due right now"}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {difficultIds.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setExtra(difficultIds);
                  setPracticeDifficult(true);
                  setI(0);
                }}
              >
                Practise difficult words ({difficultIds.length})
              </Button>
            )}
            <Button onClick={onBrowse}>Find new words</Button>
          </div>
        }
      >
        {reviewed ? "Your next reviews are scheduled. Words you found hard will return sooner." : "Save words from the bank — or from reading texts — and they’ll appear here on a spaced schedule."}
      </Empty>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex justify-between text-[12.5px] text-muted">
        <span>
          Card {i + 1} of {list.length}
          {practiceDifficult ? " · difficult words" : ""}
        </span>
        <span>{vocab[id]?.lapses ? `forgotten ${vocab[id].lapses}×` : "new"}</span>
      </div>
      <button onClick={() => setFlipped((f) => !f)} className="block w-full text-left" aria-label="Flip card">
        <Card className="grid min-h-[300px] place-items-center p-8 text-center">
          {!flipped ? (
            <div>
              <div className="font-display text-[2.2rem] leading-tight text-ink">{e.term}</div>
              {e.ipa && <div className="mt-2 text-muted">{e.ipa}</div>}
              <div className="mt-1 text-[13px] italic text-faint">{e.pos}</div>
              <div className="mt-8 text-[12.5px] text-muted">Recall the meaning, then tap to check</div>
            </div>
          ) : (
            <div className="animate-rise">
              <div className="font-display text-xl text-ink">{e.term}</div>
              <p className="mt-3 text-[15.5px] text-ink-2">{e.definition}</p>
              {e.spanish && <p className="mt-2 text-[14px] italic text-muted">🇪🇸 {e.spanish}</p>}
              {e.example && <p className="mt-3 font-display text-[15px] italic text-ink-2">“{e.example}”</p>}
              {vocab[id]?.personalExample && <p className="mt-2 text-[13px] text-ok">Your example: “{vocab[id].personalExample}”</p>}
            </div>
          )}
        </Card>
      </button>
      <div className="mt-3 flex justify-center">
        <button onClick={() => speak(e.term, variety)} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <Volume2 size={15} /> Pronounce
        </button>
      </div>
      {flipped ? (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {(
            [
              [0, "Forgot", "bg-bad-50 text-bad hover:bg-bad hover:text-card"],
              [3, "Hard", "bg-sand text-ink hover:bg-sand-2"],
              [4, "Good", "bg-ok-50 text-ok hover:bg-ok hover:text-card"],
              [5, "Easy", "bg-accent-50 text-accent-700 hover:bg-accent hover:text-card"],
            ] as const
          ).map(([g, l, c]) => (
            <button key={g} onClick={() => grade(g)} className={cx("rounded-xl py-3 text-[14px] font-medium transition-colors", c)}>
              {l}
            </button>
          ))}
        </div>
      ) : (
        <Button size="lg" className="mt-4 w-full" onClick={() => setFlipped(true)}>
          Show answer
        </Button>
      )}
    </div>
  );
}

function Quiz({ all }: { all: VocabEntry[] }) {
  const vocab = useVerba((s) => s.vocab);
  const [run, setRun] = useState(0);
  const questions = useMemo(() => {
    const saved = Object.values(vocab)
      .filter((v) => v.saved)
      .sort((a, b) => b.lapses - a.lapses)
      .map((v) => all.find((e) => e.id === v.entryId))
      .filter((e): e is VocabEntry => Boolean(e) && !e!.id.startsWith("custom"));
    const base = saved.length >= 6 ? saved.slice(0, 14) : VOCABULARY;
    return shuffle(base).slice(0, 8).map((e) => vocabQuestion(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-5 sm:p-7">
        <QuizRunner key={run} questions={questions} source="vocabulary" title="Vocabulary quiz" skill="vocabulary" activity="vocabulary" onRestart={() => setRun((r) => r + 1)} planBlock="vocab-new" />
      </Card>
    </div>
  );
}

function AddWord({ onDone }: { onDone: () => void }) {
  const add = useVerba((s) => s.addCustomWord);
  const [f, setF] = useState({ term: "", pos: "noun", definition: "", spanish: "", example: "", synonyms: "", collocations: "", register: "neutral", level: "C1", category: "c1" });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  function submit() {
    add({
      term: f.term.trim(),
      pos: f.pos,
      definition: f.definition.trim(),
      spanish: f.spanish.trim(),
      example: f.example.trim(),
      synonyms: f.synonyms.split(",").map((s) => s.trim()).filter(Boolean),
      collocations: f.collocations.split(",").map((s) => s.trim()).filter(Boolean),
      register: f.register as VocabEntry["register"],
      level: f.level as Level,
      category: f.category as VocabCategory,
      topic: "society",
    });
    onDone();
  }
  return (
    <Card className="max-w-2xl p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Word or phrase">
          <input className={inputCls} value={f.term} onChange={(e) => set("term", e.target.value)} />
        </Field>
        <Field label="Part of speech">
          <input className={inputCls} value={f.pos} onChange={(e) => set("pos", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="English definition">
            <input className={inputCls} value={f.definition} onChange={(e) => set("definition", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Explicación en español">
            <input className={inputCls} value={f.spanish} onChange={(e) => set("spanish", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Example sentence">
            <input className={inputCls} value={f.example} onChange={(e) => set("example", e.target.value)} />
          </Field>
        </div>
        <Field label="Synonyms" hint="Comma separated">
          <input className={inputCls} value={f.synonyms} onChange={(e) => set("synonyms", e.target.value)} />
        </Field>
        <Field label="Collocations" hint="Comma separated">
          <input className={inputCls} value={f.collocations} onChange={(e) => set("collocations", e.target.value)} />
        </Field>
        <Field label="Register">
          <select className={inputCls} value={f.register} onChange={(e) => set("register", e.target.value)}>
            <option>formal</option>
            <option>neutral</option>
            <option>informal</option>
          </select>
        </Field>
        <Field label="Category">
          <select className={inputCls} value={f.category} onChange={(e) => set("category", e.target.value)}>
            {CATS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Button className="mt-6" onClick={submit} disabled={!f.term.trim() || !f.definition.trim()}>
        <Plus size={16} /> Add to my words
      </Button>
    </Card>
  );
}
