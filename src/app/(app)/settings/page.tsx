"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Sparkles, Trash2, Upload } from "lucide-react";
import type { EnglishVariety, Profile } from "@/domain/types";
import { useVerba, snapshot, type VerbaData } from "@/store/verba";
import { aiAvailable } from "@/services/ai";
import { buildDemoData } from "@/data/demo";
import { Badge, Button, ButtonLink, Card, CardHeader, Chip, Field, PageHeader, inputCls } from "@/components/ui/primitives";

export default function Settings() {
  const profile = useVerba((s) => s.profile!);
  const update = useVerba((s) => s.updateProfile);
  const reset = useVerba((s) => s.reset);
  const importData = useVerba((s) => s.importData);
  const demo = useVerba((s) => s.demo);
  const router = useRouter();
  const [ai, setAi] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    aiAvailable().then(setAi);
  }, []);

  function exportData() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `verba-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onImport(f: File) {
    try {
      const d = JSON.parse(await f.text()) as VerbaData;
      if (d.version !== 1 || !d.levels) throw new Error("Not a VERBA backup");
      importData(d);
      setMsg("Backup restored.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not read that file.");
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Settings" title="Your preferences" />
      <div className="space-y-6">
        <Card className="p-6">
          <CardHeader eyebrow="Profile" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputCls} value={profile.name} onChange={(e) => update({ name: e.target.value })} />
            </Field>
            <Field label="Why C1">
              <input className={inputCls} value={profile.motivation} onChange={(e) => update({ motivation: e.target.value })} />
            </Field>
          </div>
          <div className="mt-5">
            <div className="mb-2 text-[13px] font-medium text-ink-2">English variety</div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["british", "British"],
                  ["american", "American"],
                  ["no-preference", "No preference"],
                ] as [EnglishVariety, string][]
              ).map(([v, l]) => (
                <Chip key={v} active={profile.variety === v} onClick={() => update({ variety: v })}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 text-[13px] font-medium text-ink-2">Spanish support</div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["auto", "Adaptive"],
                  ["more", "Always"],
                  ["less", "On request"],
                  ["off", "English only"],
                ] as [Profile["spanishSupport"], string][]
              ).map(([v, l]) => (
                <Chip key={v} active={profile.spanishSupport === v} onClick={() => update({ spanishSupport: v })}>
                  {l}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted">Adaptive shows Spanish notes by default until your overall estimate approaches C1, then switches to English-first.</p>
          </div>
          <div className="mt-5">
            <ButtonLink href="/plan" variant="secondary" size="sm">
              Edit study days, minutes and exam date
            </ButtonLink>
          </div>
        </Card>

        <Card className="p-6">
          <CardHeader eyebrow="AI features" title={ai === null ? "Checking…" : ai ? "Claude is connected" : "Running in offline mode"} action={ai ? <Badge tone="gold"><Sparkles size={11} /> AI on</Badge> : <Badge>Offline</Badge>} />
          <p className="text-[14px] leading-relaxed text-ink-2">
            {ai
              ? "The AI tutor and examiner-style writing feedback use Claude through VERBA’s server. Your API key stays on the server and is never sent to the browser."
              : "Everything works without AI: lessons, exercises, the offline tutor and a rule-based writing analyser. To enable Claude, set ANTHROPIC_API_KEY in .env.local and restart the server."}
          </p>
        </Card>

        <Card className="p-6">
          <CardHeader eyebrow="Your data" title="Stored on this device" />
          <p className="mb-4 text-[14px] text-ink-2">VERBA keeps all progress in this browser (no account). Export a backup to move it to another device.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportData}>
              <Download size={15} /> Export backup
            </Button>
            <Button variant="secondary" onClick={() => file.current?.click()}>
              <Upload size={15} /> Import backup
            </Button>
            <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
            {!demo && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm("Replace your data with sample progress? Export a backup first if you want to keep it.")) {
                    importData(buildDemoData({ ...profile }));
                    router.push("/");
                  }
                }}
              >
                Load sample progress
              </Button>
            )}
          </div>
          {msg && <p className="mt-3 text-[13px] text-ok">{msg}</p>}
          <div className="mt-6 border-t border-line pt-5">
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(demo ? "Clear the sample data and start fresh?" : "Delete all your VERBA data on this device? This cannot be undone.")) {
                  reset();
                  router.replace("/welcome");
                }
              }}
            >
              <Trash2 size={15} /> {demo ? "Clear sample data and start my own" : "Delete all data"}
            </Button>
          </div>
        </Card>

        <Card className="p-6 text-[13px] leading-relaxed text-muted">
          <CardHeader eyebrow="About" title="VERBA" />
          <p>Your personal path to fluency. All exercises, texts and recordings are original material written for VERBA; none are taken from Cambridge papers. Levels and grades are unofficial estimates on the Cambridge English Scale and are not affiliated with or endorsed by Cambridge University Press &amp; Assessment.</p>
        </Card>
      </div>
    </div>
  );
}
