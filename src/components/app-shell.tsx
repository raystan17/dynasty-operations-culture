"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { LOGO_ASSET } from "@/lib/brand-assets";

export type CategoryId =
  | "overview"
  | "week"
  | "teams"
  | "rivalries"
  | "legacy"
  | "sleeper"
  | "voice"
  | "brand"
  | "settings";

type Category = {
  id: CategoryId;
  label: string;
  hint: string;
  icon: React.ReactNode;
};

const iconClass = "h-5 w-5";

const CATEGORIES: Category[] = [
  {
    id: "overview",
    label: "Overview",
    hint: "League identity & status",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <path d="M3 12l9-9 9 9" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    id: "week",
    label: "This Week",
    hint: "Focus & matchups",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
      </svg>
    ),
  },
  {
    id: "teams",
    label: "Teams",
    hint: "Rosters & records",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13A4 4 0 0 1 16 11" />
      </svg>
    ),
  },
  {
    id: "rivalries",
    label: "Rivalries",
    hint: "SOTW & beefs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <path d="M14.5 6.5L20 1l3 3-5.5 5.5" />
        <path d="M9.5 17.5L4 23l-3-3 5.5-5.5" />
        <path d="M14 14l7 7" />
        <path d="M10 10L3 3" />
        <path d="M16 8l-8 8" />
      </svg>
    ),
  },
  {
    id: "legacy",
    label: "Legacy",
    hint: "Champs & ledger",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
        <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
        <path d="M6 5h12v6a6 6 0 1 1-12 0V5z" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
  },
  {
    id: "sleeper",
    label: "Sleeper",
    hint: "Sync & publish",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <path d="M21 12a9 9 0 1 1-9-9" />
        <path d="M21 3v6h-6" />
        <path d="M21 3l-9 9" />
      </svg>
    ),
  },
  {
    id: "voice",
    label: "Voice Lab",
    hint: "AI tone & phrases",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="17" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    id: "brand",
    label: "Brand Kit",
    hint: "Logo & palette",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <circle cx="13.5" cy="6.5" r="1.5" />
        <circle cx="17.5" cy="10.5" r="1.5" />
        <circle cx="8.5" cy="7.5" r="1.5" />
        <circle cx="6.5" cy="12.5" r="1.5" />
        <path d="M12 2C6.5 2 2 6 2 11c0 5 4 9 9 9 1 0 2-1 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.5 1.8-1.5H16c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    hint: "League & data",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={iconClass} aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

type AppShellProps = {
  username: string;
  role: string;
  children: React.ReactNode;
};

export function AppShell({ username, role, children }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<CategoryId>("overview");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveId(visible.target.id as CategoryId);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      }
    );

    const sections = CATEGORIES.map((c) => document.getElementById(c.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handleNav = useCallback((id: CategoryId) => {
    setActiveId(id);
    setOpen(false);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const activeCategory = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col border-r border-slate-800 bg-slate-900 transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="League categories"
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <div className="shrink-0">
            <Image
              src={LOGO_ASSET}
              alt="SoD"
              width={56}
              height={56}
              priority
              className="rounded-lg drop-shadow-[0_2px_8px_rgba(255,111,225,0.35)]"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-wide text-white">SoD</p>
            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-amber-300/90">
              Slinger&apos;s of Dynasty
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeId === cat.id;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handleNav(cat.id)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                      isActive
                        ? "bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border transition ${
                        isActive
                          ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                          : "border-slate-700 bg-slate-950 text-slate-400 group-hover:text-white"
                      }`}
                    >
                      {cat.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{cat.label}</span>
                      <span className="block truncate text-[11px] text-slate-400 group-hover:text-slate-300">
                        {cat.hint}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-amber-300" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-400/15 text-sm font-bold uppercase text-amber-200 ring-1 ring-amber-400/40"
              aria-hidden
            >
              {username.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{username}</p>
              <p className="truncate text-[10px] uppercase tracking-wide text-slate-500">{role}</p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950/85 px-3 backdrop-blur-md sm:h-16 sm:px-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-md text-slate-200 hover:bg-slate-800 lg:hidden"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <Image
              src={LOGO_ASSET}
              alt="SoD"
              width={40}
              height={40}
              priority
              className="rounded-md drop-shadow-[0_2px_6px_rgba(255,111,225,0.35)]"
            />
          </div>

          <div className="hidden flex-col leading-tight lg:flex">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300">
              {activeCategory.label}
            </p>
            <p className="text-sm font-semibold text-white">{activeCategory.hint}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-slate-400 sm:inline">
              @<span className="font-semibold text-slate-200">{username}</span>
            </span>
            <form action={logoutAction} className="hidden sm:block">
              <button
                type="submit"
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-slate-800"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-3 pb-24 pt-4 sm:px-6 sm:pb-12 sm:pt-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
