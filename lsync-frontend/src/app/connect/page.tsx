"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";
import { SourceGrid, useSourceState } from "@/components/sources/SourceGrid";
import { Banner, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useAuth } from "@/lib/auth/AuthProvider";
import { SOURCES } from "@/lib/sources";

/**
 * "Link your learning sources": the step straight after sign-up in Dan's flow (Sign up -> Link sources -> Dashboard).
 * Skipping is fine. The same cards stay available on the Dashboard, so nothing is lost by skipping.
 */
function Connect() {
  const params = useSearchParams();
  const { user } = useAuth();
  const state = useSourceState();
  const first = (user?.fullName ?? user?.username ?? "").split(" ")[0];
  const githubResult = params.get("github");

  return (
    <main className="min-h-dvh bg-page px-4 py-6 sm:px-8 lg:px-12">
      <title>Link your learning sources | LSync</title>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="self-start"><Logo className="h-10" /></div>
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-ink sm:text-4xl">Link your learning sources</h1>
            <p className="mt-3 text-body">
              {first ? `Glad to have you, ${first}. ` : ""}Connect the platforms you learn on. LSync collects your activity and builds your learning record. You can skip this and do it later from your dashboard.
            </p>
          </div>
          <div className="min-w-52 rounded-xl border border-black/10 bg-white px-4 py-3">
            <p className="text-sm font-bold text-ink">{state.inUse} of {SOURCES.length} sources connected</p>
            <div aria-hidden className="mt-2 h-2 overflow-hidden rounded-full bg-lilac-soft">
              <div className="h-full rounded-full bg-indigo-brand transition-[width] duration-700" style={{ width: `${(state.inUse / SOURCES.length) * 100}%` }} />
            </div>
          </div>
        </header>

        {githubResult === "connected" && state.gh.loading && <Banner tone="info">GitHub said yes. Checking the connection…</Banner>}
        {githubResult === "connected" && !state.gh.loading && state.ghOn && <Banner tone="success">GitHub is connected. You can choose your repositories now.</Banner>}
        {githubResult === "connected" && !state.gh.loading && !state.ghOn && (
          <Banner
            tone="warn"
            action={<Button type="button" variant="outline" onClick={state.gh.reload} className="!px-4 !py-2 !text-sm">Check again</Button>}
          >
            GitHub approved the connection, but LSync couldn&apos;t load your repositories yet. Give it a moment and check again. If it keeps happening, tell the team.
          </Banner>
        )}
        {githubResult === "error" && <Banner tone="error">We couldn&apos;t connect GitHub. Please try again.</Banner>}

        <div className="rounded-3xl bg-white/60 p-4 sm:p-6">
          <SourceGrid state={state} />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-5">
          <Link href="/dashboard" className="font-bold text-primary hover:underline">Skip for now</Link>
          <ButtonLink href="/dashboard">
            Continue to dashboard <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Connect />
    </Suspense>
  );
}
