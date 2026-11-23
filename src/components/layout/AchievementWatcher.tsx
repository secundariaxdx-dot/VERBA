"use client";
import { useEffect, useState } from "react";
import { Award, X } from "lucide-react";
import { useVerba, snapshot } from "@/store/verba";
import { ACHIEVEMENTS, newlyUnlocked } from "@/engine/achievements";

/** Quietly checks for new milestones after any data change and shows a discreet toast. */
export function AchievementWatcher() {
  const [toast, setToast] = useState<string | null>(null);

  // Re-check milestones whenever the learner's data changes.
  useEffect(
    () =>
      useVerba.subscribe((state, prev) => {
        if (state.achievements !== prev.achievements) return;
        const ids = newlyUnlocked(snapshot());
        if (!ids.length) return;
        state.unlock(ids);
        if (!state.demo) setToast(ids[ids.length - 1]);
      }),
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const a = ACHIEVEMENTS.find((x) => x.id === toast);
  if (!a) return null;
  return (
    <div className="animate-rise fixed bottom-24 right-4 z-50 flex max-w-xs items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-[var(--shadow-lift)] lg:bottom-6" role="status">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-50 text-gold">
        <Award size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="eyebrow">Milestone</div>
        <div className="font-display text-[15px] text-ink">{a.title}</div>
        <div className="text-[12.5px] text-muted">{a.description}</div>
      </div>
      <button onClick={() => setToast(null)} className="text-faint hover:text-ink" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
