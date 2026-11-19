"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card, StatCard } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { INSIGHTS, STATES, healthOf, pct, predict, type MetricKey } from "@/lib/insights";
import { useLogs } from "@/lib/logs/LogsProvider";

// Colour is never the only signal: every segment is labelled and the legend repeats the names.
const TONE = ["#0f7b5f", "#d98a1f", "#8a2f6f"];
const TEXT_ON = ["#fff", "#1b1140", "#fff"];

const METRICS = Object.keys(INSIGHTS.metrics) as MetricKey[];
const FEATURE_NAMES: Record<string, string> = {
  login_frequency: "Logins per week",
  completion_rate: "Course completion",
  completed_assignments: "Assignments completed",
  forum_posts_count: "Forum posts",
  last_activity_days_ago: "Days since last activity",
  exam_season: "Exam season",
  courses_enrolled: "Number of courses",
  age: "Age",
};

function Stack({ shares }: { shares: number[] }) {
  return (
    <div className="flex h-9 overflow-hidden rounded-lg bg-black/5" aria-hidden>
      {shares.map((s, i) =>
        s > 0 ? (
          <div key={i} className="grow-x grid place-items-center overflow-hidden text-xs font-bold" style={{ width: `${s * 100}%`, background: TONE[i], color: TEXT_ON[i] }}>
            {s >= 0.08 ? pct(s) : ""}
          </div>
        ) : null,
      )}
    </div>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-body">
      {STATES.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: TONE[i] }} aria-hidden />
          {s}
        </li>
      ))}
    </ul>
  );
}

function DriverExplorer() {
  const [metric, setMetric] = useState<MetricKey>("login_frequency");
  const [picked, setPicked] = useState<Record<string, number>>({});
  const m = INSIGHTS.metrics[metric];
  const idx = Math.min(picked[metric] ?? 0, m.buckets.length - 1);
  const b = m.buckets[idx];

  return (
    <Card title="What separates students who stay from those who drop out?" subtitle="Pick a habit, then pick a group to see what happened to those students.">
      <Segmented label="Habit" value={metric} onChange={setMetric} options={METRICS.map((k) => ({ value: k, label: INSIGHTS.metrics[k].title }))} />
      <p className="mt-3 text-sm text-body">{m.blurb}</p>
      <div className="mt-4 flex flex-col gap-2" key={metric}>
        {m.buckets.map((x, i) => (
          <button
            key={x.label}
            type="button"
            aria-pressed={i === idx}
            onClick={() => setPicked({ ...picked, [metric]: i })}
            className={`grid grid-cols-[96px_1fr] items-center gap-3 rounded-xl border p-2 text-left transition-colors sm:grid-cols-[130px_1fr] ${i === idx ? "border-indigo-brand bg-lilac-soft/60" : "border-transparent hover:bg-black/5"}`}
          >
            <span className="text-sm font-semibold text-ink">{x.label}</span>
            <Stack shares={x.shares} />
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Legend />
      </div>
      <p className="mt-4 rounded-xl bg-lilac-soft px-4 py-3 text-ink" aria-live="polite">
        <strong>{b.n.toLocaleString()} students</strong> in the group &ldquo;{b.label}&rdquo; ({m.title.toLowerCase()}): {pct(b.shares[2])} dropped, {pct(b.shares[1])} were at risk and {pct(b.shares[0])} stayed active.
      </p>
    </Card>
  );
}

function HabitChecker() {
  const { logs, today } = useLogs();
  const mine = useMemo(() => healthOf(logs, today), [logs, today]);
  const [logins, setLogins] = useState(3);
  const [completion, setCompletion] = useState(25);
  const [posts, setPosts] = useState(3);
  const p = predict({ logins, completion: completion / 100, posts });
  const top = p.indexOf(Math.max(...p));
  const verdict = ["Looks like a learner who stays active.", "Looks like a learner who needs a nudge.", "Looks like a learner who is about to drop off."][top];

  const slider = (id: string, label: string, value: number, set: (n: number) => void, min: number, max: number, step: number, suffix: string) => (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id} className="font-semibold text-ink">{label}</label>
        <output htmlFor={id} className="font-bold text-indigo-brand">{value}{suffix}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-1 w-full accent-indigo-brand" />
    </div>
  );

  return (
    <Card tone="peach" title="Try a learning habit" subtitle="Move the sliders and see what the benchmark says about someone who learns like this.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          {slider("sl-logins", "Learning days per week", logins, setLogins, 0, 7, 0.5, "")}
          {slider("sl-completion", "Course work completed", completion, setCompletion, 0, 100, 5, "%")}
          {slider("sl-posts", "Community posts or discussions", posts, setPosts, 0, 24, 1, "")}
          {logs.length > 0 && (
            <Button type="button" variant="outline" className="!py-2 text-sm self-start" onClick={() => setLogins(Math.min(7, Math.round(mine.perWeek * 2) / 2))}>
              Use my last 4 weeks ({mine.perWeek} days a week)
            </Button>
          )}
        </div>
        <div aria-live="polite">
          <p className="mb-3 font-bold text-ink">{verdict}</p>
          <ul className="flex flex-col gap-3">
            {STATES.map((s, i) => (
              <li key={s}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-ink">{s}</span><span className="font-bold text-ink">{pct(p[i])}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-black/5" aria-hidden>
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${p[i] * 100}%`, background: TONE[i] }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Estimate from a simple model fitted to the dataset ({pct(INSIGHTS.model.cvAccuracy)} accurate on held-back students). A guide, not a prediction about you.</p>
        </div>
      </div>
    </Card>
  );
}


type Region = (typeof INSIGHTS.regions)[number];

/** Sketch map: dots are placed from approximate longitude and latitude, so no map file is needed. */
const mapX = (lon: number) => 6 + ((lon + 9) / 66) * 88;
const mapY = (lat: number) => 6 + ((38 - lat) / 15) * 82;

function CityExplorer() {
  const [city, setCity] = useState<string>(INSIGHTS.regions[0].city);
  const r: Region = INSIGHTS.regions.find((x) => x.city === city) ?? INSIGHTS.regions[0];
  const maxN = Math.max(...INSIGHTS.regions.map((x) => x.n));
  return (
    <Card title="Learners around the region" subtitle="Pick a city to see how students there did, and how the number of courses they carried relates to it.">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0">
          <div aria-hidden className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl bg-plum">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.7) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            {INSIGHTS.regions.map((x) => {
              const on = x.city === city;
              const size = 14 + (x.n / maxN) * 10;
              return (
                <button
                  key={x.city}
                  type="button"
                  tabIndex={-1}
                  onClick={() => setCity(x.city)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${mapX(x.lon)}%`, top: `${mapY(x.lat)}%` }}
                >
                  <span className={`block rounded-full border-2 border-white transition-all ${on ? "bg-[#b9acff] shadow-[0_0_0_6px_rgba(185,172,255,.35),0_0_24px_rgba(185,172,255,.9)]" : "bg-indigo-brand group-hover:bg-[#b9acff]"}`} style={{ width: size, height: size }} />
                  <span className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/40 px-1.5 text-[11px] font-bold text-white ${on ? "" : "hidden group-hover:block"}`}>{x.city}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">Sketch map: positions are approximate, dot size shows how many students are in the dataset.</p>
        </div>

        <div className="min-w-0">
          <div role="group" aria-label="Choose a city" className="flex flex-wrap gap-2">
            {INSIGHTS.regions.map((x) => (
              <button key={x.city} type="button" aria-pressed={x.city === city} onClick={() => setCity(x.city)} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${x.city === city ? "border-indigo-brand bg-lilac-soft text-indigo-brand" : "border-black/10 text-body hover:bg-black/5"}`}>
                {x.city}
                <span className="font-normal text-muted"> · {x.country}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-peach/70 p-4" aria-live="polite">
            <h3 className="text-lg font-bold text-ink">{r.city}, {r.country}</h3>
            <p className="text-sm text-muted">{r.n.toLocaleString()} students in the dataset</p>
            <div className="mt-3"><Stack shares={r.shares} /></div>
            <div className="mt-2"><Legend /></div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[["Courses each", r.avgCourses.toFixed(1)], ["Logins a week", r.avgLogins.toFixed(1)], ["Completion", pct(r.avgCompletion)]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-page p-2.5">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="text-xl font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <h3 className="mt-6 text-base font-bold text-ink">Courses carried vs outcome in {r.city}</h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {r.byCourses.map((b) => (
          <li key={b.label} className="rounded-xl border border-black/10 p-3">
            <p className="text-sm font-bold text-ink">{b.label} <span className="font-normal text-muted">· {b.n} students</span></p>
            <div className="mt-2"><Stack shares={b.shares} /></div>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-[#7a4a00]">
        Honest reading: the gap between cities is small (about {Math.round(Math.max(...INSIGHTS.regions.map((x) => x.shares[0])) * 100 - Math.min(...INSIGHTS.regions.map((x) => x.shares[0])) * 100)} points in the share who stay active), and carrying more courses barely changes the outcome. Habits such as logging in often matter far more than where you live or how many courses you take. The dataset has a city per student but no course names, so we compare numbers of courses, not subjects.
      </p>
    </Card>
  );
}

export default function InsightsPage() {
  const top = INSIGHTS.correlation[0];
  const dropOrRisk = INSIGHTS.overall[1] + INSIGHTS.overall[2];
  const exam = INSIGHTS.context.exam_season;

  return (
    <>
      <PageHeader title="Learning insights">
        <Link href="/dashboard" className="font-bold text-primary hover:underline">← Back to dashboard</Link>
      </PageHeader>
      <div className="flex flex-col gap-4">
        <Banner tone="info">
          Benchmark from <strong>{INSIGHTS.total.toLocaleString()} students</strong> in the EdTech dataset our group was given (10 cities, enrolled in 2024). It shows what keeps learners going. It is not data about LSync users.
        </Banner>

        <section aria-label="Key findings" className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Dropped out or at risk" value={pct(dropOrRisk)} sub={`${pct(INSIGHTS.overall[2])} dropped, ${pct(INSIGHTS.overall[1])} at risk`} />
          <StatCard label="Strongest signal" value={FEATURE_NAMES[top.feature]} sub={`${pct(INSIGHTS.metrics.login_frequency.buckets[0].shares[2] + INSIGHTS.metrics.login_frequency.buckets[0].shares[1])} of students at 1 login a week or less are at risk or gone`} />
          <StatCard label="Exam season effect" value={`+${Math.round((exam[1].shares[1] + exam[1].shares[2] - exam[0].shares[1] - exam[0].shares[2]) * 100)} pts`} sub="more students at risk or dropped during exams" />
        </section>

        <DriverExplorer />
        <CityExplorer />
        <HabitChecker />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="What relates most to dropping out" subtitle="Strength of link with the outcome (0 = none, 1 = perfect)">
            <ul className="flex flex-col gap-3">
              {INSIGHTS.correlation.map((c) => (
                <li key={c.feature}>
                  <div className="mb-1 flex justify-between gap-3 text-sm"><span className="font-semibold text-ink">{FEATURE_NAMES[c.feature]}</span><span className="text-body">{Math.abs(c.r).toFixed(2)}</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-lilac-soft" aria-hidden>
                    <div className="grow-x h-full rounded-full bg-indigo-brand" style={{ width: `${Math.abs(c.r) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">Age and the number of courses a student takes show almost no link, so LSync doesn&apos;t use them.</p>
          </Card>

          <Card title="How LSync uses this" subtitle="Rules we took from the data">
            <ul className="flex flex-col gap-3 text-body">
              <li><strong className="text-ink">Habit first.</strong> Learning days per week is the main engagement metric. Under 2 is a warning, 4 or more is healthy.</li>
              <li><strong className="text-ink">Nudge late, not early.</strong> Silence only predicts dropout after about 2 weeks, so reminders fire at 14 days, not 3.</li>
              <li><strong className="text-ink">Exam weeks need extra support.</strong> More learners slip during exams, so reminders get gentler and shorter then.</li>
              <li><strong className="text-ink">Show progress, not volume.</strong> Completing work and joining discussions matter more than how many courses someone starts.</li>
            </ul>
            <Link href="/dashboard" className="mt-4 inline-block font-bold text-primary hover:underline">See your own learning health</Link>
          </Card>
        </div>
      </div>
    </>
  );
}
