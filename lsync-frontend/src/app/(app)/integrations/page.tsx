"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { githubConnected, startGithubConnect } from "@/lib/api/services";
import { useAsync } from "@/lib/hooks/useAsync";
import { useLogs } from "@/lib/logs/LogsProvider";
import { SOURCES, type Source } from "@/lib/sources";
import { fmtHours, sourceTotals } from "@/lib/stats";

/**
 * "Link your learning sources". New accounts land here straight after sign-up (?welcome=1), as in Dan's flow:
 * Sign up -> Link sources -> Dashboard. It is also the permanent Sources page in the sidebar.
 * GitHub connects through the backend. Everything else is logged manually until the backend supports more.
 */
function Sources() {
  const params = useSearchParams();
  const router = useRouter();
  const welcome = params.get("welcome") === "1";
  const githubResult = params.get("github");
  const { logs, status } = useLogs();
  const gh = useAsync(githubConnected);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = new Map(sourceTotals(logs).map((t) => [t.name.toLowerCase(), t]));
  const ghOn = gh.data === true;
  const inUse = SOURCES.filter((s) => (s.id === "GitHub" ? ghOn : (totals.get(s.id.toLowerCase())?.sessions ?? 0) > 0)).length;

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

  function card(s: Source) {
    const t = totals.get(s.id.toLowerCase());
    const isGithub = s.id === "GitHub";
    let pill: { text: string; tone: "good" | "plain" | "busy" };
    let body: string;
    if (isGithub) {
      pill = gh.loading ? { text: "Checking…", tone: "busy" } : ghOn ? { text: "Connected", tone: "good" } : { text: "Not connected", tone: "plain" };
      body = ghOn
        ? "Choose which repositories to sync. Commits matched to your GitHub account show up in your activity."
        : "Import repositories and commits as evidence of what you build while you learn.";
    } else {
      pill = t ? { text: `${t.sessions} ${t.sessions === 1 ? "log" : "logs"} · ${fmtHours(t.minutes)}`, tone: "good" } : { text: "Nothing logged yet", tone: "plain" };
      body =
        s.id === "YouTube"
          ? "Log the videos and playlists you want counted as learning. Automatic import is coming soon."
          : s.id === "Blogs and docs"
            ? "Log the articles and documentation you read. Reading time counts towards your skills."
            : `Log what you learn on ${s.id}. Hours count towards your skills and growth.`;
    }
    const pillCls = pill.tone === "good" ? "bg-success-soft text-success" : pill.tone === "busy" ? "bg-lilac-soft text-indigo-brand" : "bg-black/5 text-body";

    return (
      <li key={s.id} className="flex flex-col rounded-2xl border border-peach/70 bg-white p-5">
        <div className="flex items-center gap-3">
          <SourceBadge name={s.id} />
          <div>
            <h3 className="font-bold text-ink">{s.id}</h3>
            <p className="text-sm text-muted">{s.blurb}</p>
          </div>
        </div>
        <p className={`mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${pillCls}`}>
          {pill.tone === "good" && <Check className="size-3.5" aria-hidden />}
          {pill.text}
        </p>
        <p className="mt-3 flex-1 text-sm text-body">{body}</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {isGithub ? (
            ghOn ? (
              <ButtonLink href="/integrations/github" className="flex-1">
                Choose repositories
              </ButtonLink>
            ) : (
              <Button type="button" onClick={connectGithub} loading={connecting} disabled={gh.loading} className="flex-1">
                Connect GitHub
              </Button>
            )
          ) : (
            <>
              <ButtonLink href={`/learning-logs?add=1&platform=${encodeURIComponent(s.id)}`} className="flex-1">
                Add manually
              </ButtonLink>
              {s.connectSoon && (
                <Button type="button" variant="outline" disabled title="Automatic import is coming soon" className="flex-1">
                  Connect (soon)
                </Button>
              )}
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <>
      <PageHeader title="Link your learning sources">
        <div className="min-w-48 rounded-xl border border-black/10 px-4 py-2.5">
          <p className="text-sm font-bold text-ink">
            {inUse} of {SOURCES.length} sources in use
          </p>
          <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-lilac-soft">
            <div className="h-full rounded-full bg-indigo-brand" style={{ width: `${(inUse / SOURCES.length) * 100}%` }} />
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4">
        {welcome ? (
          <p className="max-w-2xl text-body">Welcome to LSync. Bring in what you already learn so your dashboard has something to show. You can skip this now and come back any time from Sources.</p>
        ) : (
          <p className="max-w-2xl text-body">Connect the platforms you learn on, or log them yourself. You can change this at any time.</p>
        )}

        {githubResult === "connected" && (
          <Banner tone="success" action={<ButtonLink href="/integrations/github" className="!px-4 !py-2 !text-sm">Choose repositories</ButtonLink>}>
            GitHub is connected.
          </Banner>
        )}
        {githubResult === "error" && <Banner tone="error">We couldn&apos;t connect GitHub. Please try again.</Banner>}
        {error && <Banner tone="error">{error}</Banner>}
        {gh.error && <Banner tone="warn">We couldn&apos;t check your GitHub connection right now. Other sources still work.</Banner>}

        {status === "loading" ? (
          <Loading label="Loading your sources" />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{SOURCES.map(card)}</ul>
        )}

        {welcome && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-5">
            <Link href="/dashboard" className="font-bold text-primary hover:underline">
              Skip for now
            </Link>
            <ButtonLink href="/dashboard" onClick={() => router.prefetch("/dashboard")}>
              Continue to dashboard <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        )}
      </div>
    </>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Sources />
    </Suspense>
  );
}
