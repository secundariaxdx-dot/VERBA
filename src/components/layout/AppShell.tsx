"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { NAV, MOBILE_TABS } from "./nav";
import { Wordmark, LogoMark } from "@/components/ui/Logo";
import { cx } from "@/components/ui/primitives";
import { useHydrated } from "@/hooks/useHydrated";
import { useVerba } from "@/store/verba";
import { AchievementWatcher } from "./AchievementWatcher";
import { bandFor } from "@/engine/levels";
import { overallScore } from "@/engine/adaptive";

const GROUP_LABEL = { main: "", skills: "Skills", track: "Progress" } as const;

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const levels = useVerba((s) => s.levels);
  const name = useVerba((s) => s.profile?.name);
  const score = overallScore(levels);
  return (
    <nav className="flex h-full flex-col" aria-label="Main">
      <div className="px-5 pb-6 pt-6">
        <Link href="/" onClick={onNavigate} aria-label="VERBA home">
          <Wordmark />
        </Link>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {(["main", "skills", "track"] as const).map((g) => (
          <div key={g} className="mb-4">
            {GROUP_LABEL[g] && <div className="eyebrow px-3 pb-1.5 pt-2">{GROUP_LABEL[g]}</div>}
            <ul className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = isActive(path, n.href);
                const Icon = n.icon;
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] transition-colors",
                        active ? "bg-card font-medium text-ink shadow-[var(--shadow-soft)]" : "text-ink-2 hover:bg-sand/70 hover:text-ink",
                      )}
                    >
                      <Icon size={17} strokeWidth={1.8} className={active ? "text-accent" : "text-muted group-hover:text-ink-2"} />
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="m-3 rounded-2xl border border-line/70 bg-card/70 p-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-50 font-display text-[15px] font-semibold text-accent-700">{(name || "V").charAt(0).toUpperCase()}</div>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-medium text-ink">{name || "Learner"}</div>
            <div className="text-[12px] text-muted">
              {bandFor(score).label} → C1 target
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const profile = useVerba((s) => s.profile);
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !profile) router.replace("/welcome");
  }, [hydrated, profile, router]);

  if (!hydrated || !profile) {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream">
        <LogoMark size={44} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr] lg:bg-[linear-gradient(to_right,rgb(233_223_208/0.4)_264px,transparent_264px)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line/60 lg:block">
        <SideNav />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line/60 bg-cream/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" aria-label="VERBA home">
          <Wordmark />
        </Link>
        <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <div className="animate-rise absolute inset-y-0 left-0 w-[82%] max-w-[300px] bg-cream shadow-[var(--shadow-lift)]">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 grid h-9 w-9 place-items-center rounded-full hover:bg-sand" aria-label="Close menu">
              <X size={18} />
            </button>
            <SideNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Quick">
        <ul className="grid grid-cols-5">
          {NAV.filter((n) => MOBILE_TABS.includes(n.href)).map((n) => {
            const active = isActive(path, n.href);
            const Icon = n.icon;
            return (
              <li key={n.href}>
                <Link href={n.href} className={cx("flex flex-col items-center gap-0.5 py-2.5 text-[10.5px]", active ? "text-accent" : "text-muted")}>
                  <Icon size={20} strokeWidth={1.8} />
                  {n.label.replace("My ", "").replace("Daily ", "")}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setOpen(true)} className="flex w-full flex-col items-center gap-0.5 py-2.5 text-[10.5px] text-muted">
              <Menu size={20} strokeWidth={1.8} />
              More
            </button>
          </li>
        </ul>
      </nav>
      <AchievementWatcher />
    </div>
  );
}
