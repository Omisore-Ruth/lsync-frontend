"use client";

import { Lock, RefreshCw, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner, EmptyState, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { githubConnected, listGithubRepos, startGithubConnect, syncGithubRepo } from "@/lib/api/services";
import { useAsync } from "@/lib/hooks/useAsync";
import type { SyncResult } from "@/lib/types";

type Outcome = { ok: true; result: SyncResult } | { ok: false; message: string };

/** GitHub repositories with a Sync button. Follows the behaviour in the backend handoff (section 10). */
export default function GithubPage() {
  const repos = useAsync(async () => ((await githubConnected()) ? await listGithubRepos() : null));
  const [syncing, setSyncing] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [connectError, setConnectError] = useState<string | null>(null);

  async function sync(fullName: string) {
    setSyncing(fullName);
    try {
      const result = await syncGithubRepo(fullName);
      setOutcomes((o) => ({ ...o, [fullName]: { ok: true, result } }));
    } catch (e) {
      setOutcomes((o) => ({ ...o, [fullName]: { ok: false, message: e instanceof Error ? e.message : "Sync failed." } }));
    } finally {
      setSyncing(null);
    }
  }

  async function connect() {
    setConnectError(null);
    try {
      window.location.assign(await startGithubConnect());
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : "We couldn't start the GitHub connection.");
    }
  }

  return (
    <>
      <PageHeader title="GitHub repositories">
        <ButtonLink href="/dashboard" variant="outline" className="!py-2.5 text-sm">
          Back to dashboard
        </ButtonLink>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <Banner tone="warn">
          Private repositories can be listed here, but filtering them out of your public portfolio isn&apos;t finished yet. For now, sync repositories you&apos;re happy to have saved.
        </Banner>

        {repos.loading && <Loading label="Loading repositories" />}
        {repos.error && <Banner tone="error" action={<Button type="button" variant="outline" onClick={repos.reload} className="!px-4 !py-2 !text-sm">Try again</Button>}>{repos.error}</Banner>}
        {connectError && <Banner tone="error">{connectError}</Banner>}

        {repos.data === null && (
          <EmptyState title="GitHub isn't connected yet" text="Connect your GitHub account to choose repositories and sync your commits.">
            <Button type="button" onClick={connect}>
              Connect GitHub
            </Button>
          </EmptyState>
        )}

        {repos.data && repos.data.length === 0 && <EmptyState title="No repositories found" text="This GitHub account has no repositories we can read." />}

        {repos.data && repos.data.length > 0 && (
          <ul className="flex flex-col gap-3">
            {repos.data.map((r) => {
              const out = outcomes[r.fullName];
              const busy = syncing === r.fullName;
              return (
                <li key={r.fullName} className="rounded-2xl bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="flex flex-wrap items-center gap-2 font-bold text-ink">
                        {r.fullName}
                        {r.private && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-[#7a4a00]">
                            <Lock className="size-3" aria-hidden /> Private
                          </span>
                        )}
                        {r.fork && <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-bold text-body">Fork</span>}
                      </h2>
                      {r.description && <p className="mt-1 text-sm text-body">{r.description}</p>}
                      <p className="mt-2 flex items-center gap-4 text-sm text-muted">
                        {r.language && <span>{r.language}</span>}
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5" aria-hidden /> {r.stars}
                          <span className="sr-only">stars</span>
                        </span>
                      </p>
                    </div>
                    <Button type="button" variant="outline" loading={busy} disabled={syncing !== null && !busy} onClick={() => sync(r.fullName)} className="!py-2.5 text-sm">
                      {!busy && <RefreshCw className="size-4" aria-hidden />} Sync commits
                    </Button>
                  </div>

                  {out?.ok === false && (
                    <div className="mt-4">
                      <Banner tone="error">{out.message}</Banner>
                    </div>
                  )}
                  {out?.ok && (
                    <div className="mt-4">
                      {/* inserted = 0 is not a failure: it means everything was already saved */}
                      <Banner tone={out.result.inserted > 0 ? "success" : "info"}>
                        <strong>{out.result.inserted > 0 ? `${out.result.inserted} new ${out.result.inserted === 1 ? "commit" : "commits"} saved.` : "Already up to date."}</strong>
                        <span className="mt-0.5 block font-normal">
                          Fetched {out.result.fetched} · New {out.result.inserted} · Already saved {out.result.alreadyExisting} · Account matched {out.result.matched} · Unverified {out.result.unverified}
                        </span>
                      </Banner>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {outcomes && Object.values(outcomes).some((o) => o.ok) && (
          <p className="text-sm text-body">
            Synced commits appear in <Link href="/activity" className="font-bold text-primary hover:underline">Activity</Link>. &ldquo;Account matched&rdquo; means GitHub linked the commit to your account. It doesn&apos;t certify a skill.
          </p>
        )}
      </div>
    </>
  );
}
