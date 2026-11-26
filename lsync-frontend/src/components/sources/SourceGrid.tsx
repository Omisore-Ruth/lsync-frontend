"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextField } from "@/components/ui/TextField";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { githubConnected, linkAccount, listLinkedAccounts, startGithubConnect, unlinkAccount } from "@/lib/api/services";
import { useAsync } from "@/lib/hooks/useAsync";
import { useLogs } from "@/lib/logs/LogsProvider";
import { SOURCES, type Source } from "@/lib/sources";
import { fmtHours, sourceTotals } from "@/lib/stats";

/** Which sources the learner already uses: GitHub connected, a linked profile, or at least one log. Shared by the dashboard and the connect step. */
export function useSourceState() {
  const { logs } = useLogs();
  const gh = useAsync(githubConnected);
  const accounts = useAsync(listLinkedAccounts);
  const totals = new Map(sourceTotals(logs).map((t) => [t.name.toLowerCase(), t]));
  const linked = new Map((accounts.data ?? []).map((a) => [a.source.toLowerCase(), a]));
  const ghOn = gh.data === true;
  const inUse = SOURCES.filter((s) => (s.id === "GitHub" ? ghOn : linked.has(s.id.toLowerCase()) || (totals.get(s.id.toLowerCase())?.sessions ?? 0) > 0)).length;
  return { gh, ghOn, totals, accounts, linked, inUse };
}

const FIELD: Record<string, { name: string; hint: string; urlLabel: string }> = {
  "Blogs and docs": { name: "Site or blog name", hint: "For example: dev.to or MDN", urlLabel: "Link to your profile or blog (optional)" },
};
const fieldFor = (id: string) => FIELD[id] ?? { name: `Your ${id} username`, hint: "The name shown on your profile", urlLabel: "Profile link (optional)" };

/** The source cards: GitHub connects through the backend, everything else is logged by hand for now. */
export function SourceGrid({ state, variant = "full" }: { state: ReturnType<typeof useSourceState>; variant?: "full" | "tiles" }) {
  const { gh, ghOn, totals, linked, accounts } = state;
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState<Source | null>(null);
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function closeDialog() {
    setLinking(null);
    setUsername("");
    setUrl("");
    setDialogError(null);
  }

  async function confirmLink() {
    if (!linking) return;
    if (username.trim().length < 2) return setDialogError("Enter the name shown on your profile.");
    setBusy(true);
    setDialogError(null);
    try {
      await linkAccount(linking.id, username, url);
      closeDialog();
      accounts.reload();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "We couldn't link that account.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(id: string) {
    setError(null);
    try {
      await unlinkAccount(id);
      accounts.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't disconnect that account.");
    }
  }

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
      const a = linked.get(s.id.toLowerCase());
      pill = a ? { text: `Profile linked: ${a.username}`, tone: "good" } : t ? { text: `${t.sessions} ${t.sessions === 1 ? "log" : "logs"} · ${fmtHours(t.minutes)}`, tone: "good" } : { text: "Not connected", tone: "plain" };
      body = a ? (t ? `${t.sessions} ${t.sessions === 1 ? "log" : "logs"} · ${fmtHours(t.minutes)} counted towards your skills.` : "Your profile is linked. Add a log whenever you learn here and the hours count towards your skills.") : s.id === "YouTube" ? "Link your channel name, then log the videos you want counted. Automatic import is coming soon." : s.id === "Blogs and docs" ? "Link a site you read, and log the articles and docs. Reading time counts towards your skills." : `Link your ${s.id} profile, then log what you learn. Hours count towards your skills and growth.`;
    }
    const pillCls = pill.tone === "good" ? "bg-success-soft text-success" : pill.tone === "busy" ? "bg-lilac-soft text-indigo-brand" : "bg-black/5 text-body";
    return (
      <li key={s.id} style={{ animationDelay: `${i * 70}ms` }} className="rise group flex flex-col rounded-2xl border border-peach/70 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-brand/40 hover:shadow-lg">
        <div className="flex items-center gap-3">
          <SourceBadge name={s.id} />
          <div className="min-w-0">
            <h2 className="font-bold text-ink">{s.id}</h2>
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
          ) : linked.has(s.id.toLowerCase()) ? (
            <>
              <ButtonLink href={`/activity?add=1&platform=${encodeURIComponent(s.id)}`} className="flex-1 !py-2.5 text-sm">Add a log</ButtonLink>
              <Button type="button" variant="outline" onClick={() => void disconnect(linked.get(s.id.toLowerCase())!.id)} className="flex-1 !py-2.5 text-sm">Disconnect</Button>
            </>
          ) : (
            <>
              <Button type="button" onClick={() => setLinking(s)} disabled={accounts.loading} className="flex-1 !py-2.5 text-sm">Link {s.id === "Blogs and docs" ? "a site" : `${s.id} profile`}</Button>
              <ButtonLink href={`/activity?add=1&platform=${encodeURIComponent(s.id)}`} variant="outline" className="flex-1 !py-2.5 text-sm">Add manually</ButtonLink>
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Banner tone="error">{error}</Banner>}
      {gh.error && <Banner tone="warn">We couldn&apos;t check your GitHub connection right now. Other sources still work.</Banner>}
      {accounts.error && <Banner tone="warn">We couldn&apos;t load your linked accounts right now. You can still add logs manually.</Banner>}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{SOURCES.map(card)}</ul>
      <ConfirmDialog open={linking !== null} title={linking ? `Link your ${linking.id} profile` : "Link a profile"} confirmLabel="Link profile" busy={busy} onConfirm={confirmLink} onCancel={closeDialog}>
        {linking && (
          <>
            <p>We save this name on your LSync profile so your portfolio can show it. We don&apos;t check it with {linking.id} and we don&apos;t import your hours, so you still add logs yourself.</p>
            <div className="mt-4 grid gap-3">
              <TextField label={fieldFor(linking.id).name} placeholder={fieldFor(linking.id).hint} autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
              <TextField label={fieldFor(linking.id).urlLabel} type="url" placeholder="https://" autoComplete="off" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            {dialogError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{dialogError}</p>}
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
