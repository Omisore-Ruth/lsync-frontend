"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { m, useInView, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SourceBadge } from "@/components/ui/SourceBadge";

/**
 * The hero tells the headline as a tiny story: the places you learn start scattered,
 * then settle into one portfolio. One idea, one gentle movement, and a replay button.
 * The notes stay honest: only GitHub connects directly today.
 */
const INFO: Record<string, string> = {
  GitHub: "Connects directly. Your commits and repositories become learning activity.",
  YouTube: "Log the tutorials you watch so they count towards your skills.",
  Coursera: "Link your profile and add the courses you finish.",
  Udemy: "Link your profile and add the courses you finish.",
  edX: "Link your profile and add the courses you finish.",
  "Blogs and docs": "Keep track of what you read, right next to everything else.",
};

/** dx and dy: where the chip starts, in pixels away from its place. r: its tilt while scattered. */
const CHIPS = [
  { id: "GitHub", dx: 110, dy: 120, r: -14 },
  { id: "YouTube", dx: -40, dy: 60, r: 10 },
  { id: "Coursera", dx: 150, dy: 150, r: 8 },
  { id: "Udemy", dx: -190, dy: 90, r: -9 },
  { id: "edX", dx: 60, dy: 30, r: 12 },
  { id: "Blogs and docs", dx: -150, dy: 140, r: -6 },
];

/** Example figures only, shown to explain the idea. */
const SKILLS = [
  { label: "Web development", hours: "14 h", pct: 72, bar: "bg-indigo-brand" },
  { label: "Data analysis", hours: "8 h", pct: 46, bar: "bg-primary-soft" },
  { label: "UX design", hours: "5 h", pct: 30, bar: "bg-peach" },
];
const HEAT = [0, 1, 0, 2, 3, 1, 0, 1, 2, 3, 2, 4, 2, 0, 0, 2, 4, 3, 1, 0, 1, 2, 3, 3, 4, 2, 1, 0];
const HEAT_COLOUR = ["bg-lilac-soft", "bg-lilac", "bg-primary-soft", "bg-primary", "bg-violet-deep"];

const SPRING = { type: "spring", stiffness: 85, damping: 15 } as const;

const chipVariants: Variants = {
  scattered: (c: (typeof CHIPS)[number]) => ({ x: c.dx, y: c.dy, rotate: c.r, transition: { ...SPRING, stiffness: 60 } }),
  synced: (c: (typeof CHIPS)[number]) => ({ x: 0, y: 0, rotate: 0, transition: { ...SPRING, delay: CHIPS.indexOf(c) * 0.07 } }),
};
const panelVariants: Variants = {
  scattered: { opacity: 0.3, scale: 0.985 },
  synced: { opacity: 1, scale: 1, transition: { duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function Title() {
  const lines = [
    { words: ["All", "your", "learning."], tone: "text-ink" },
    { words: ["Finally", "in", "one", "place."], tone: "text-primary" },
  ];
  let n = 0;
  return (
    <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.6rem]">
      {lines.map((line) => (
        <span key={line.tone} className={`block ${line.tone}`}>
          {line.words.map((w) => (
            <span key={w}>
              <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                <m.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.1 + n++ * 0.07 }}
                >
                  {w}
                </m.span>
              </span>{" "}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

function Stage() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [synced, setSynced] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!inView) return;
    timer.current = window.setTimeout(() => setSynced(true), 1900);
    return () => window.clearTimeout(timer.current);
  }, [inView]);

  function replay() {
    window.clearTimeout(timer.current);
    setSynced(false);
    timer.current = window.setTimeout(() => setSynced(true), 1000);
  }

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
      className="relative mx-auto mt-10 w-full max-w-4xl overflow-hidden text-left rounded-[28px] border border-white bg-white/90 p-4 shadow-[0_30px_80px_-30px_rgba(81,14,172,0.45)] sm:p-7"
    >
      <m.div initial="scattered" animate={synced ? "synced" : "scattered"}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.webp" alt="" width={360} height={336} decoding="async" className="h-8 w-auto shrink-0 sm:h-9" />
            <div>
              <p className="text-sm font-bold text-ink sm:text-base">Your learning portfolio</p>
              <p className="text-xs font-semibold text-muted">Example view</p>
            </div>
          </div>
          <button
            type="button"
            onClick={replay}
            aria-label="Replay the animation"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-lilac-soft sm:px-3.5"
          >
            <RotateCcw className="size-3.5" aria-hidden /> <span className="hidden sm:inline">Replay</span>
          </button>
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">Where you learn</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2.5 sm:justify-start">
          {CHIPS.map((c) => (
            <m.button
              key={c.id}
              type="button"
              custom={c}
              variants={chipVariants}
              onClick={() => setActive((a) => (a === c.id ? null : c.id))}
              onMouseEnter={() => setActive(c.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(c.id)}
              onBlur={() => setActive(null)}
              aria-label={`${c.id}. ${INFO[c.id]}`}
              className="relative z-10 flex items-center gap-2.5 rounded-2xl border border-black/10 bg-white py-2 pl-2 pr-3.5 text-sm font-semibold text-ink shadow-sm transition-shadow hover:shadow-md"
            >
              <SourceBadge name={c.id} size={30} />
              {c.id}
            </m.button>
          ))}
        </div>
        <p aria-live="polite" className="mt-3 min-h-6 text-sm text-body">
          {active ? <><strong className="text-ink">{active}.</strong> {INFO[active]}</> : synced ? "Everything in one place. Hover or tap a platform to see how it connects." : "Learning is spread over many places…"}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-[1.25fr_1fr]">
          <m.div variants={panelVariants} className="rounded-2xl border border-black/10 bg-card p-5">
            <p className="text-sm font-bold text-ink">Skills</p>
            <ul className="mt-4 flex flex-col gap-4">
              {SKILLS.map((s, i) => (
                <li key={s.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-ink">{s.label}</span>
                    <span className="text-muted">{s.hours}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-lilac-soft">
                    <m.span
                      className={`block h-full rounded-full ${s.bar}`}
                      variants={{ scattered: { width: "0%" }, synced: { width: `${s.pct}%`, transition: { duration: 1.1, delay: 0.7 + i * 0.15, ease: [0.22, 1, 0.36, 1] } } }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-black/10 pt-3 text-xs text-muted">27 hours across 3 skills this month</p>
          </m.div>

          <m.div variants={panelVariants} className="rounded-2xl border border-black/10 bg-card p-5">
            <p className="text-sm font-bold text-ink">Activity</p>
            <div aria-hidden className="mt-4 grid grid-cols-7 gap-1.5">
              {HEAT.map((level, i) => (
                <m.span
                  key={i}
                  className={`aspect-square rounded-md ${HEAT_COLOUR[level]}`}
                  variants={{ scattered: { opacity: 0, scale: 0.5 }, synced: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.8 + i * 0.015 } } }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Each square is a day you learned.</p>
          </m.div>
        </div>
      </m.div>
    </m.div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:pb-24 lg:pt-12">
      {/* Two soft colour washes behind the page. Plain CSS, very slow, and only on bigger screens, so phones stay smooth. */}
      <div aria-hidden className="blob blob-a pointer-events-none absolute -left-32 -top-24 size-[460px] rounded-full bg-lilac/50 blur-3xl" />
      <div aria-hidden className="blob blob-b pointer-events-none absolute -right-24 top-24 size-[380px] rounded-full bg-peach/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl text-center">
        <m.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-indigo-brand shadow-sm"
        >
          Your Unified Learning Portfolio
        </m.p>
        <div className="mt-5">
          <Title />
        </div>
        <m.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-body"
        >
          Connect the places you learn, log what you study, and see your progress and skills in one clear view. Then choose what you want to share.
        </m.p>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-6 flex flex-wrap justify-center gap-3"
        >
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:bg-primary-hover">
            Get started <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/#how-it-works" className="inline-flex items-center rounded-xl border border-black/10 bg-white px-6 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-lilac-soft">
            See how it works
          </Link>
        </m.div>

        <Stage />
      </div>
    </section>
  );
}
