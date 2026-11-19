"use client";

import { useMemo, useState } from "react";
import { BarChart } from "@/components/charts/Charts";
import { Heatmap } from "@/components/charts/Heatmap";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner, EmptyState, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card, StatCard } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLogs } from "@/lib/logs/LogsProvider";
import { RANGE_LABEL, activeDaysIn, addDays, bestWeekday, bucketsFor, calendar, fmtDuration, fmtHours, minutesBetween, minutesByDay, periodSpan, series, skillsSummary, startOfMonth, startOfWeek, streaks, trackTotals, type Range } from "@/lib/stats";

const RANGES: Range[] = ["7d", "30d", "12w", "1y"];
const MIX = ["#4b3fd6", "#1b1140", "#a79ee6", "#e8861f", "#0f7b5f", "#6d6889"];
const DEFAULT_GOAL = 10;

function useGoal(userId: string) {
  const key = `lsync_goal_hours_${userId}`;
  const [goal, setGoal] = useState(() => {
    try {
      const n = Number(localStorage.getItem(key));
      return n >= 1 && n <= 100 ? n : DEFAULT_GOAL;
    } catch {
      return DEFAULT_GOAL;
    }
  });
  const save = (n: number) => {
    setGoal(n);
    try {
      localStorage.setItem(key, String(n));
    } catch {
      /* the goal just won't survive a reload */
    }
  };
  return [goal, save] as const;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { logs, status, error, reload, today } = useLogs();
  const [range, setRange] = useState<Range>("12w");
  const [goal, setGoal] = useGoal(String(user?.id ?? user?.username ?? "me"));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [goalError, setGoalError] = useState<string | null>(null);

  const d = useMemo(() => {
    const byDay = minutesByDay(logs);
    const span = periodSpan(range, today);
    const chart = series(logs, range, today);
    const minutes = chart.reduce((s, c) => s + c.minutes, 0);
    const prevFrom = addDays(span.from, -span.days);
    const prevMinutes = minutesBetween(byDay, prevFrom, addDays(span.from, -1));
    const weekStart = startOfWeek(today);
    const weeks = bucketsFor("12w", today);
    const goalMinutes = goal * 60;
    return {
      span,
      chart: chart.map((c) => ({ label: c.label, value: Math.round(c.minutes / 6) / 10 })),
      minutes,
      avgPerDay: minutes / span.days,
      avgDelta: minutes / span.days - prevMinutes / span.days,
      activeDays: activeDaysIn(logs, span.from, today),
      streak: streaks(logs, today),
      cal: calendar(logs, today, 26),
      tracks: trackTotals(logs),
      thisWeek: minutesBetween(byDay, weekStart, today),
      lastWeek: minutesBetween(byDay, addDays(weekStart, -7), addDays(weekStart, -1)),
      weeksReached: weeks.filter((w) => minutesBetween(byDay, w.from, w.to) >= goalMinutes).length,
      best: bestWeekday(logs, today),
      topThisMonth: [...skillsSummary(logs, today)].sort((a, b) => b.monthMinutes - a.monthMinutes)[0],
      monthStart: startOfMonth(today),
    };
  }, [logs, range, today, goal]);

  const totalMix = d.tracks.reduce((s, t) => s + t.minutes, 0);
  const chartTitle = range === "1y" ? "Hours per month" : range === "12w" ? "Hours per week" : "Hours per day";
  const reached = d.thisWeek >= goal * 60;
  const weekChange = d.lastWeek > 0 ? Math.round(((d.thisWeek - d.lastWeek) / d.lastWeek) * 100) : null;
  const calSummary = `Learning calendar for the last 26 weeks. ${streaks(logs, today).activeDays} days with learning logged in total.`;

  function saveGoal() {
    const n = Number(draft);
    if (!Number.isFinite(n) || n < 1 || n > 100) {
      setGoalError("Enter a goal between 1 and 100 hours.");
      return;
    }
    setGoal(Math.round(n * 2) / 2);
    setEditing(false);
    setGoalError(null);
  }

  return (
    <>
      <PageHeader title="Learning analytics">
        <Segmented label="Time range" value={range} onChange={setRange} options={RANGES.map((r) => ({ value: r, label: RANGE_LABEL[r] }))} />
      </PageHeader>

      {status === "loading" && <Loading label="Loading analytics" />}
      {status === "error" && (
        <Banner tone="error" action={<Button type="button" variant="outline" onClick={() => void reload()} className="!px-4 !py-2 !text-sm">Try again</Button>}>
          {error}
        </Banner>
      )}
      {status === "ready" && logs.length === 0 && (
        <EmptyState title="No data to analyse yet" text="Analytics are calculated from your learning logs. Add a few and this page fills in.">
          <ButtonLink href="/activity?add=1">Add a learning log</ButtonLink>
        </EmptyState>
      )}

      {status === "ready" && logs.length > 0 && (
        <div className="flex flex-col gap-4">
          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Hours learned" value={fmtHours(d.minutes)} sub={`In the last ${RANGE_LABEL[range].toLowerCase()}`} />
            <StatCard label="Average per day" value={fmtHours(Math.round(d.avgPerDay))} sub={d.avgDelta === 0 ? "Same as the previous period" : `${d.avgDelta > 0 ? "+" : "-"}${fmtHours(Math.round(Math.abs(d.avgDelta)))} vs previous period`} subTone={d.avgDelta > 0 ? "good" : "muted"} />
            <StatCard label="Active days" value={`${d.activeDays} of ${d.span.days}`} sub={`${Math.round((d.activeDays / d.span.days) * 100)}% consistency`} />
            <StatCard label="Longest streak" value={`${d.streak.longest} ${d.streak.longest === 1 ? "day" : "days"}`} sub={`Current streak: ${d.streak.current}`} />
          </section>

          <Card title={chartTitle}>
            <BarChart data={d.chart} title={`${chartTitle}, last ${RANGE_LABEL[range].toLowerCase()}`} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Learning calendar" subtitle="Last 26 weeks">
              <Heatmap columns={d.cal.columns} monthLabels={d.cal.monthLabels} summary={calSummary} />
            </Card>
            <Card title="Insights">
              <ul className="divide-y divide-black/5 text-sm">
                {d.best && (
                  <li className="py-3 first:pt-0">
                    <p className="font-bold text-ink">Your best day is {d.best.name}</p>
                    <p className="text-muted">You learn {fmtDuration(d.best.avgMinutes)} on average.</p>
                  </li>
                )}
                {d.topThisMonth && d.topThisMonth.monthMinutes > 0 && (
                  <li className="py-3 first:pt-0">
                    <p className="font-bold text-ink">{d.topThisMonth.name} is your focus this month</p>
                    <p className="text-muted">{fmtHours(d.topThisMonth.monthMinutes)} logged since {d.monthStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.</p>
                  </li>
                )}
                <li className="py-3 first:pt-0">
                  <p className="font-bold text-ink">{weekChange === null ? "This week" : weekChange >= 0 ? `Learning time is up ${weekChange}%` : `Learning time is down ${Math.abs(weekChange)}%`}</p>
                  <p className="text-muted">
                    {fmtHours(d.thisWeek)} this week{weekChange !== null && `, against ${fmtHours(d.lastWeek)} last week`}.
                  </p>
                </li>
              </ul>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Learning mix" subtitle="By track, across all your logs">
              <div role="img" aria-label={`Learning mix: ${d.tracks.map((t) => `${t.name} ${Math.round((t.minutes / totalMix) * 100)}%`).join(", ")}`} className="flex h-4 overflow-hidden rounded-full">
                {d.tracks.map((t, i) => (
                  <span key={t.name} style={{ width: `${(t.minutes / totalMix) * 100}%`, background: MIX[i % MIX.length] }} />
                ))}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {d.tracks.map((t, i) => (
                  <li key={t.name} className="flex items-center gap-3 text-sm">
                    <span aria-hidden className="size-3 rounded-sm" style={{ background: MIX[i % MIX.length] }} />
                    <span className="flex-1 font-semibold text-ink">{t.name}</span>
                    <span className="text-body">
                      {fmtHours(t.minutes)} · {Math.round((t.minutes / totalMix) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Weekly goal">
              <p className="text-3xl font-bold text-ink">
                {fmtHours(d.thisWeek)} <span className="text-base font-medium text-muted">of your {goal} h goal this week</span>
              </p>
              <div role="progressbar" aria-label="Weekly goal progress" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(Math.round((d.thisWeek / 60) * 10) / 10, goal)} className="mt-3 h-3 overflow-hidden rounded-full bg-lilac-soft">
                <div className="h-full rounded-full bg-indigo-brand" style={{ width: `${Math.min((d.thisWeek / (goal * 60)) * 100, 100)}%` }} />
              </div>
              {reached && <p className="mt-3 inline-block rounded-full bg-success-soft px-3 py-1 text-sm font-bold text-success">Goal reached</p>}
              <p className="mt-3 text-sm text-body">You reached your goal in {d.weeksReached} of the last 12 weeks.</p>
              {editing ? (
                <form
                  className="mt-4 flex flex-wrap items-start gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveGoal();
                  }}
                >
                  <div>
                    <label htmlFor="goal" className="mb-1 block text-sm font-semibold text-ink">
                      Hours per week
                    </label>
                    <input id="goal" inputMode="decimal" value={draft} onChange={(e) => setDraft(e.target.value)} className="w-28 rounded-xl border border-peach bg-[#f7f5f6] px-3 py-2.5" aria-invalid={goalError ? true : undefined} aria-describedby={goalError ? "goal-err" : undefined} />
                    {goalError && (
                      <p id="goal-err" role="alert" className="mt-1 text-sm font-medium text-danger">
                        {goalError}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-6">
                    <Button type="submit" className="!px-4 !py-2.5 text-sm">
                      Save
                    </Button>
                    <Button type="button" variant="outline" className="!px-4 !py-2.5 text-sm" onClick={() => { setEditing(false); setGoalError(null); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button type="button" variant="outline" className="mt-4 !py-2.5 text-sm" onClick={() => { setDraft(String(goal)); setEditing(true); }}>
                  Edit goal
                </Button>
              )}
              <p className="mt-3 text-xs text-muted">Your goal is saved on this device until goals are supported by the server.</p>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
