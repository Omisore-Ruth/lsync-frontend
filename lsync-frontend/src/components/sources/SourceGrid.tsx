"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { githubConnected, startGithubConnect } from "@/lib/api/services";
import { useAsync } from "@/lib/hooks/useAsync";
import { useLogs } from "@/lib/logs/LogsProvider";
import { SOURCES, type Source } from "@/lib/sources";
import { fmtHours, sourceTotals } from "@/lib/stats";

/** How many of the sources the learner already uses. Shared by the dashboard hero and the sources card. */
export function useSourceState() {
  const { logs } = useLogs();
  const gh = useAsync(githubConnected);
  const totals = new Map(sourceTotals(logs).map((t) => [t.name.toLowerCase(), t]));
  const ghOn = gh.data === true;
  const inUse = SOURCES.filter((s) => (s.id === "GitHub" ? ghOn : (totals.get(s.id.toLowerCase())?.sessions ?? 0) > 0)).length;
  return { gh, ghOn, totals, inUse };
}

/** The source cards: GitHub connects through the backend, everything else is logged by hand for now. */
export function SourceGrid({ state, variant = "full" }: { state: ReturnType<typeof useSourceState>; variant?: "full" | "tiles" }) {
  const { gh, ghOn, totals } = state;
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connectGithub() {
    setError(null);
    setConnecting(true);
    try {
      window.location.assign(await startGithubConnect());
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't start the GitHub connection.");
      setConnecting(false);
    }
  }

  function card(s: Source, i: number) {
    const t = totals.get(s.id.toLowerCase());
    const isGithub = s.id === "GitHub";
    let pill: { text: string; tone: "good" | "plain" | "busy" };
    let body: string;
    if (isGithub) {
      pill = gh.loading ? { text: "Checking…", tone: "busy" } : ghOn ? { text: "Connected", tone: "good" } : { text: "Not connected", tone: "plain" };
      body = ghOn ? "Choose which repositories to sync. Matched commits show up in your activity." : "Import repositories and commits as evidence of what you build while you learn.";
    } else {
      pill = t ? { text: `${t.sessions} ${t.sessions === 1 ? "log" : "logs"} · ${fmtHours(t.minutes)}`, tone: "good" } : { text: "Nothing logged yet", tone: "plain" };
      body = s.id === "YouTube" ? "Log the videos and playlists you want counted. Automatic import is coming soon." : s.id === "Blogs and docs" ? "Log the articles and docs you read. Reading time counts towards your skills." : `Log what you learn on ${s.id}. Hours count towards your skills and growth.`;
    }
    const pillCls = pill.tone === "good" ? "bg-success-soft text-success" : pill.tone === "busy" ? "bg-lilac-soft text-indigo-brand" : "bg-black/5 text-body";
    return (
      <li key={s.id} style={{ animationDelay: `${i * 70}ms` }} className="rise group flex flex-col rounded-2xl border border-peach/70 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-brand/40 hover:shadow-lg">
        <div className="flex items-center gap-3">
          <SourceBadge name={s.id} />
          <div className="min-w-0">
            <h3 className="font-bold text-ink">{s.id}</h3>
            <p className="text-sm text-muted">{s.blurb}</p>
          </div>
        </div>
        <p className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${pillCls}`}>
          {pill.tone === "good" && <Check className="size-3.5" aria-hidden />}
          {pill.text}
        </p>
        {variant === "full" && <p className="mt-3 flex-1 text-sm text-body">{body}</p>}
        <div className="mt-4 flex flex-wrap gap-2.5">
          {isGithub ? (
            ghOn ? (
              <ButtonLink href="/integrations/github" className="flex-1 !py-2.5 text-sm">Choose repositories</ButtonLink>
            ) : (
              <Button type="button" onClick={connectGithub} loading={connecting} disabled={gh.loading} className="flex-1 !py-2.5 text-sm">Connect GitHub</Button>
            )
          ) : (
            <ButtonLink href={`/activity?add=1&platform=${encodeURIComponent(s.id)}`} className="flex-1 !py-2.5 text-sm">Add manually</ButtonLink>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Banner tone="error">{error}</Banner>}
      {gh.error && <Banner tone="warn">We couldn&apos;t check your GitHub connection right now. Other sources still work.</Banner>}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{SOURCES.map(card)}</ul>
    </div>
  );
}
