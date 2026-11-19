"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner, EmptyState, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card, StatCard } from "@/components/ui/Card";
import { useLogs } from "@/lib/logs/LogsProvider";
import { LEVELS, fmtHours, keyOf, skillsSummary, startOfMonth, trackTotals } from "@/lib/stats";

export default function SkillsPage() {
  const { logs, status, error, reload, today } = useLogs();
  const [track, setTrack] = useState("All");

  const rows = useMemo(() => skillsSummary(logs, today), [logs, today]);
  const tracks = useMemo(() => trackTotals(logs), [logs]);
  const monthStart = keyOf(startOfMonth(today));
  const newThisMonth = rows.filter((r) => r.firstKey >= monthStart).length;
  const strongest = tracks[0];
  const growth = [...rows].sort((a, b) => b.monthMinutes - a.monthMinutes)[0];
  const shown = track === "All" ? rows : rows.filter((r) => (r.track ?? "Other") === track);

  return (
    <>
      <PageHeader title="Skill map" />
      <p className="mb-4 max-w-2xl text-body">Your learning logs grouped into skills. The more hours you log on a skill, the higher its level.</p>

      {status === "loading" && <Loading label="Loading your skills" />}
      {status === "error" && (
        <Banner tone="error" action={<Button type="button" variant="outline" onClick={() => void reload()} className="!px-4 !py-2 !text-sm">Try again</Button>}>
          {error}
        </Banner>
      )}
      {status === "ready" && rows.length === 0 && (
        <EmptyState title="No skills yet" text="Skills appear as soon as you log learning time. Each log names the skill you practised.">
          <ButtonLink href="/activity?add=1">Add a learning log</ButtonLink>
        </EmptyState>
      )}

      {status === "ready" && rows.length > 0 && (
        <div className="flex flex-col gap-4">
          <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Skills mapped" value={String(rows.length)} sub={`${newThisMonth} new this month`} subTone={newThisMonth > 0 ? "good" : "muted"} />
            <StatCard label="Strongest area" value={strongest?.name ?? "None yet"} sub={strongest ? `${fmtHours(strongest.minutes)} across ${strongest.sources.size} ${strongest.sources.size === 1 ? "source" : "sources"}` : undefined} />
            <StatCard label="Biggest growth area" value={growth && growth.monthMinutes > 0 ? growth.name : "None this month"} sub={growth && growth.monthMinutes > 0 ? `+${fmtHours(growth.monthMinutes)} this month` : undefined} subTone="good" />
          </section>

          <Card title="Skills by category">
            <div role="group" aria-label="Filter by category" className="mb-4 flex flex-wrap gap-2">
              {["All", ...tracks.map((t) => t.name)].map((t) => (
                <button key={t} type="button" aria-pressed={track === t} onClick={() => setTrack(t)} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${track === t ? "border-indigo-brand bg-lilac-soft text-indigo-brand" : "border-black/10 text-body hover:bg-black/5"}`}>
                  {t}
                </button>
              ))}
            </div>
            <ul className="divide-y divide-black/5">
              {shown.map((s) => (
                <li key={s.name} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 py-3.5 md:grid-cols-[1fr_170px_110px]">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{s.name}</p>
                    <p className="truncate text-sm text-muted">{[s.track, s.platforms.join(", ")].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-2.5 md:col-span-1 md:order-none">
                    <span aria-hidden className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <span key={i} className={`h-1.5 w-8 rounded-full ${i <= s.level ? "bg-indigo-brand" : "bg-black/10"}`} />
                      ))}
                    </span>
                    <span className="text-sm font-bold text-ink">{LEVELS[s.level - 1]}</span>
                  </div>
                  <div className="row-start-1 text-right md:row-start-auto">
                    <p className="font-bold text-ink">{fmtHours(s.minutes)}</p>
                    <p className={`text-sm font-medium ${s.monthMinutes > 0 ? "text-success" : "text-muted"}`}>{s.monthMinutes > 0 ? `+${fmtHours(s.monthMinutes)} this month` : "No change this month"}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">Levels are based on hours logged: Beginner under 20 h, Intermediate 20 to 60 h, Advanced 60 h or more.</p>
          </Card>
        </div>
      )}
    </>
  );
}
