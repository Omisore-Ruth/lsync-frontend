"use client";

import { Plus, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { HBars, LineChart } from "@/components/charts/Charts";
import { InsightsOrb } from "@/components/dashboard/InsightsOrb";
import { SourceGrid, useSourceState } from "@/components/sources/SourceGrid";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card, StatCard } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { buildActivity } from "@/lib/activity";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useCommits } from "@/lib/hooks/useCommits";
import { healthOf } from "@/lib/insights";
import { useLogs } from "@/lib/logs/LogsProvider";
import { SOURCES } from "@/lib/sources";
import { LEVELS, dayKey, fmtHours, keyOf, minutesBetween, minutesByDay, series, skillsSummary, sourceTotals, startOfMonth, startOfWeek, streaks, totalMinutes, type Range } from "@/lib/stats";

const RANGES: { value: Range; label: string }[] = [
  { value: "4w", label: "4 weeks" },
  { value: "12w", label: "12 weeks" },
  { value: "1y", label: "1 year" },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;


const ORBIT = SOURCES.map((s, i) => ({ id: s.id, angle: (360 / SOURCES.length) * i }));

/** Blank-dashboard welcome: the sources orbit the LSync mark, then the cards below let the learner link them. */
function ConnectHero({ first, inUse }: { first: string; inUse: number }) {
  return (
    <section aria-label="Get started" className="relative overflow-hidden rounded-3xl bg-plum p-6 text-white sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-indigo-brand/40 blur-3xl" />
      <div className="relative grid items-center gap-6 md:grid-cols-[1fr_240px]">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#d9d2ff]">Let&apos;s get you set up</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Glad to have you, {first || "learner"}.</h2>
          <p className="mt-3 max-w-xl text-lg text-white/90">Connect available platforms to begin tracking your learning progress.</p>
          <div className="mt-5 max-w-xs">
            <p className="text-sm font-bold">{inUse} of {SOURCES.length} sources connected</p>
            <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-[#b9acff] transition-[width] duration-700" style={{ width: `${(inUse / SOURCES.length) * 100}%` }} />
            </div>
          </div>
          <a href="#sources" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-brand hover:bg-lilac-soft">
            Connect platforms now <span aria-hidden>→</span>
          </a>
        </div>
        <div aria-hidden className="relative mx-auto hidden size-60 md:block">
          <span className="absolute inset-6 rounded-full border border-dashed border-white/30" />
          <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl bg-white shadow-[0_0_40px_rgba(185,172,255,.6)]">
            <Image src="/brand/logo-mark.webp" alt="" width={48} height={48} />
          </span>
          <div className="orbit absolute inset-0">
            {ORBIT.map((o) => (
              <div key={o.id} className="absolute left-1/2 top-1/2 -ml-5 -mt-5" style={{ transform: `rotate(${o.angle}deg) translateX(96px) rotate(${-o.angle}deg)` }}>
                <div className="orbit-item"><SourceBadge name={o.id} size={40} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SourcesPanel({ state, open, onToggle }: { state: ReturnType<typeof useSourceState>; open: boolean; onToggle: () => void }) {
  return (
    <Card title="Your sources" subtitle={`${state.inUse} of ${SOURCES.length} in use`} action={<Button type="button" variant="outline" onClick={onToggle} aria-expanded={open} className="!px-4 !py-2 text-sm">{open ? "Hide sources" : "Add or manage sources"}</Button>}>
      <ul className="flex flex-wrap gap-2">
        {SOURCES.map((s) => {
          const on = s.id === "GitHub" ? state.ghOn : state.linked.has(s.id.toLowerCase()) || (state.totals.get(s.id.toLowerCase())?.sessions ?? 0) > 0;
          return (
            <li key={s.id} className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold ${on ? "border-success/30 bg-success-soft text-success" : "border-black/10 text-muted"}`}>
              <SourceBadge name={s.id} size={26} />
              {s.id}
              <span className="sr-only">{on ? "in use" : "not in use"}</span>
            </li>
          );
        })}
      </ul>
      {open && <div className="mt-5"><SourceGrid state={state} /></div>}
    </Card>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { logs, status, error, reload, today } = useLogs();
  const commits = useCommits();
  const [range, setRange] = useState<Range>("12w");
  const params = useSearchParams();
  const sourceState = useSourceState();
  const [showSources, setShowSources] = useState(false);
  const githubResult = params.get("github");

  const m = useMemo(() => {
    const byDay = minutesByDay(logs);
    const monthStart = keyOf(startOfMonth(today));
    return {
      total: totalMinutes(logs),
      thisWeek: minutesBetween(byDay, startOfWeek(today), today),
      sessionsThisMonth: logs.filter((l) => dayKey(l.date) >= monthStart).length,
      streak: streaks(logs, today),
      sources: sourceTotals(logs).slice(0, 5),
      topSkills: skillsSummary(logs, today).slice(0, 3),
    };
  }, [logs, today]);

  const health = useMemo(() => healthOf(logs, today), [logs, today]);
  const chart = useMemo(() => series(logs, range, today).map((s) => ({ label: s.label, value: Math.round(s.minutes / 6) / 10 })), [logs, range, today]);
  const recent = useMemo(() => buildActivity(logs, commits.data ?? [], today).slice(0, 5), [logs, commits.data, today]);

  const first = (user?.fullName ?? user?.username ?? "").split(" ")[0];
  const commitCount = commits.data?.length ?? 0;

  return (
    <>
      <PageHeader title={status === "ready" && logs.length > 0 ? `Welcome back, ${first || "learner"}` : "Dashboard"}>
        <div className="flex flex-wrap items-center gap-3">
          {status === "ready" && logs.length > 0 && (
            <Button type="button" variant="outline" onClick={() => void reload()} className="!py-2.5 text-sm">
              <RefreshCw className="size-4" aria-hidden /> Refresh
            </Button>
          )}
          <ButtonLink href="/activity?add=1" className="!py-2.5 text-sm">
            <Plus className="size-4" aria-hidden /> Add learning log
          </ButtonLink>
        </div>
      </PageHeader>

      {githubResult === "connected" && (
        <div className="mb-4">
          <Banner tone="success" action={<ButtonLink href="/integrations/github" className="!px-4 !py-2 !text-sm">Choose repositories</ButtonLink>}>GitHub is connected.</Banner>
        </div>
      )}
      {githubResult === "error" && <div className="mb-4"><Banner tone="error">We couldn&apos;t connect GitHub. Please try again.</Banner></div>}

      {status === "loading" && <Loading label="Loading your dashboard" />}
      {status === "error" && (
        <Banner tone="error" action={<Button type="button" variant="outline" onClick={() => void reload()} className="!px-4 !py-2 !text-sm">Try again</Button>}>
          {error}
        </Banner>
      )}

      {status === "ready" && logs.length === 0 && (
        <div className="flex flex-col gap-5">
          <ConnectHero first={first} inUse={sourceState.inUse} />
          <section id="sources" aria-label="Link your learning sources" className="scroll-mt-4">
            <h2 className="mb-1 text-xl font-bold text-ink">Link your learning sources</h2>
            <p className="mb-4 max-w-2xl text-body">Connect the platforms you learn on, or log them yourself. Your charts, streaks and skills fill in as soon as there is something to show.</p>
            <SourceGrid state={sourceState} />
          </section>
          <InsightsOrb />
        </div>
      )}

      {status === "ready" && logs.length > 0 && (
        <div className="flex flex-col gap-4">
          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total learning time" value={fmtHours(m.total)} sub={m.thisWeek > 0 ? `+${fmtHours(m.thisWeek)} this week` : "Nothing logged this week yet"} subTone={m.thisWeek > 0 ? "good" : "muted"} />
            <StatCard label="Learning sessions" value={String(logs.length)} sub={`${m.sessionsThisMonth} this month`} />
            <StatCard label="Current streak" value={plural(m.streak.current, "day")} sub={`Best streak: ${plural(m.streak.longest, "day")}`} subTone={m.streak.current > 0 ? "good" : "muted"} />
          </section>

          <section aria-label="Learning health" className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-white p-5 sm:p-6">
            <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-ink">Learning health</h2>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${health.level === "on-track" ? "bg-success-soft text-success" : health.level === "slowing" ? "bg-warn-soft text-[#7a4a00]" : "bg-danger-soft text-danger"}`}>{health.title}</span>
              </div>
              <p className="text-body">{health.message}</p>
            </div>
            <div className="w-full sm:w-64" aria-hidden>
              <div className="mb-1 flex justify-between text-xs text-muted"><span>0</span><span>Learning days per week</span><span>7</span></div>
              <div className="relative h-3 rounded-full bg-gradient-to-r from-[#fdd9d5] via-[#ffe7ad] to-[#bfe9d8]">
                <span className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-indigo-brand shadow transition-[left] duration-700" style={{ left: `${Math.min(health.perWeek / 7, 1) * 100}%` }} />
              </div>
            </div>
            <Link href="/insights" className="font-bold text-primary hover:underline">See how other learners compare</Link>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Learning growth over time" action={<Segmented label="Time range" value={range} onChange={setRange} options={RANGES} />}>
              <LineChart data={chart} title={`Hours learned per ${range === "1y" ? "month" : "week"}, ${range === "4w" ? "last 4 weeks" : range === "12w" ? "last 12 weeks" : "last year"}`} />
            </Card>
            <Card tone="peach" title="Activity by source" subtitle="Hours from your learning logs">
              <HBars rows={m.sources.map((s) => ({ label: s.name, value: s.minutes, display: fmtHours(s.minutes) }))} />
              {commitCount > 0 && <p className="mt-4 text-xs text-muted">Plus {plural(commitCount, "GitHub commit")}, which aren&apos;t counted in hours.</p>}
            </Card>
          </div>

          <SourcesPanel state={sourceState} open={showSources} onToggle={() => setShowSources((v) => !v)} />
          <InsightsOrb />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Recent activity">
              <ul className="divide-y divide-black/5">
                {recent.map((a) => (
                  <li key={a.id} className="flex items-center gap-4 py-3">
                    <SourceBadge name={a.source} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{a.title}</p>
                      <p className="truncate text-sm text-muted">{a.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink">{a.amount}</p>
                      <p className="text-sm text-muted">{a.when}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/activity" className="mt-3 inline-block font-bold text-primary hover:underline">
                View all activity
              </Link>
            </Card>

            <Card title="Skills you're building" subtitle="Based on your learning logs">
              <ul className="flex flex-col gap-3">
                {m.topSkills.map((s) => (
                  <li key={s.name} className="rounded-xl border border-black/10 p-3.5">
                    <p className="font-bold text-ink">{s.name}</p>
                    <p className="text-sm text-muted">
                      {fmtHours(s.minutes)} · {LEVELS[s.level - 1]}
                    </p>
                  </li>
                ))}
              </ul>
              <Link href="/skills" className="mt-3 inline-block font-bold text-primary hover:underline">
                See all skills
              </Link>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
}
