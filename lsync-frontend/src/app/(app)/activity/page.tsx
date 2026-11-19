"use client";

import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LogForm } from "@/components/logs/LogForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner, EmptyState, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { buildActivity } from "@/lib/activity";
import { githubConnected } from "@/lib/api/services";
import { useAsync } from "@/lib/hooks/useAsync";
import { useCommits } from "@/lib/hooks/useCommits";
import { useLogs } from "@/lib/logs/LogsProvider";
import { SOURCES } from "@/lib/sources";
import { fmtDuration, sourceTotals } from "@/lib/stats";

const PER_PAGE = 8;

function Activity() {
  const params = useSearchParams();
  const { logs, status, error, reload, remove, today } = useLogs();
  const [formOpen, setFormOpen] = useState(params.get("add") === "1");
  const [saved, setSaved] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; title: string; amount: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const commits = useCommits();
  const gh = useAsync(githubConnected);
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const items = useMemo(() => buildActivity(logs, commits.data ?? [], today), [logs, commits.data, today]);
  const sources = useMemo(() => [...new Set(items.map((i) => i.source))], [items]);
  const filtered = filter === "All" ? items : items.filter((i) => i.source === filter);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const totals = new Map(sourceTotals(logs).map((t) => [t.name.toLowerCase(), t]));

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await remove(toDelete.id);
      setToDelete(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "We couldn't delete that log.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader title="Learning activity">
        {!formOpen && (
          <Button type="button" onClick={() => { setFormOpen(true); setSaved(false); }} className="!py-2.5 text-sm">
            <Plus className="size-4" aria-hidden /> Add learning log
          </Button>
        )}
      </PageHeader>
      <p className="mb-4 max-w-2xl text-body">Everything from your logs and connected sources, in one timeline. Add a log yourself, or sync GitHub from the Sources card.</p>

      <div className="mb-4 flex flex-col gap-4">
        {saved && !formOpen && <Banner tone="success">Log saved. It now counts towards your dashboard.</Banner>}
        {formOpen && (
          <LogForm initialPlatform={params.get("platform") ?? ""} onDone={() => { setFormOpen(false); setSaved(true); setPage(1); }} onCancel={() => setFormOpen(false)} />
        )}
      </div>

      {status === "loading" && <Loading label="Loading your activity" />}
      {status === "error" && (
        <Banner tone="error" action={<Button type="button" variant="outline" onClick={() => void reload()} className="!px-4 !py-2 !text-sm">Try again</Button>}>
          {error}
        </Banner>
      )}
      {status === "ready" && items.length === 0 && !formOpen && (
        <EmptyState title="Nothing here yet" text="Add a learning log, or connect your platforms from the dashboard, and it will show up in this timeline.">
          <Button type="button" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden /> Add a learning log
          </Button>
          <Link href="/dashboard#sources" className="inline-flex items-center justify-center rounded-xl border border-peach bg-white px-5 py-3 font-semibold text-ink hover:bg-peach-soft">
            Connect a source
          </Link>
        </EmptyState>
      )}

      {status === "ready" && items.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <section aria-label="Activity timeline" className="min-w-0 rounded-2xl bg-white">
            <div role="group" aria-label="Filter by source" className="flex flex-wrap gap-2 border-b border-black/5 p-4">
              {["All", ...sources].map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={filter === s}
                  onClick={() => { setFilter(s); setPage(1); }}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${filter === s ? "border-indigo-brand bg-lilac-soft text-indigo-brand" : "border-black/10 text-body hover:bg-black/5"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <ul className="divide-y divide-black/5">
              {visible.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <SourceBadge name={a.source} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {a.title}
                        </a>
                      ) : (
                        a.title
                      )}
                    </p>
                    <p className="truncate text-sm text-muted">{a.subtitle}</p>
                    {a.matched && <span className="mt-1 inline-block rounded-full bg-success-soft px-2 py-0.5 text-xs font-bold text-success">GitHub account matched</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink">{a.amount}</p>
                    <p className="text-sm text-muted">{a.when}</p>
                  </div>
                  {a.logId && (
                    <button
                      type="button"
                      onClick={() => { setDeleteError(null); setToDelete({ id: a.logId!, title: a.title, amount: a.amount }); }}
                      aria-label={`Delete log: ${a.title}, ${a.amount}, ${a.when}`}
                      className="grid size-11 shrink-0 place-items-center rounded-lg text-body hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-5" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 p-4">
              <p className="text-sm text-muted" aria-live="polite">
                Showing {(current - 1) * PER_PAGE + 1} to {Math.min(current * PER_PAGE, filtered.length)} of {filtered.length} activities
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={current <= 1} onClick={() => setPage(current - 1)} className="!px-4 !py-2 text-sm">
                  <ChevronLeft className="size-4" aria-hidden /> Previous
                </Button>
                <Button type="button" variant="outline" disabled={current >= pages} onClick={() => setPage(current + 1)} className="!px-4 !py-2 text-sm">
                  Next <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </nav>
          </section>

          <Card title="Sources" subtitle="What's feeding your timeline">
            <ul className="flex flex-col gap-3.5">
              <li className="flex items-start justify-between gap-3 text-sm">
                <span className="font-bold text-ink">GitHub</span>
                <span className="text-right">
                  {gh.loading ? (
                    <span className="text-muted">Checking…</span>
                  ) : gh.data ? (
                    <>
                      <span className="font-bold text-success">Connected</span>
                      <span className="block text-muted">{commits.data?.length ?? 0} commits synced</span>
                      <Link href="/integrations/github" className="font-bold text-primary hover:underline">
                        Sync repositories
                      </Link>
                    </>
                  ) : (
                    <Link href="/dashboard#sources" className="font-bold text-primary hover:underline">
                      Not connected · Connect
                    </Link>
                  )}
                </span>
              </li>
              {SOURCES.filter((s) => s.id !== "GitHub").map((s) => {
                const t = totals.get(s.id.toLowerCase());
                return (
                  <li key={s.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="font-bold text-ink">{s.id}</span>
                    <span className="text-right text-muted">{t ? `${t.sessions} ${t.sessions === 1 ? "log" : "logs"} · ${fmtDuration(t.minutes)}` : "No logs yet"}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-muted">Logs you add yourself are saved straight away. GitHub updates when you sync a repository.</p>
          </Card>
        </div>
      )}

      <ConfirmDialog open={toDelete !== null} title="Delete this log?" confirmLabel="Delete log" danger busy={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)}>
        {toDelete && (
          <>
            <p>{toDelete.title}, {toDelete.amount}. This can&apos;t be undone, and your totals will change.</p>
            {deleteError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{deleteError}</p>}
          </>
        )}
      </ConfirmDialog>
    </>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Activity />
    </Suspense>
  );
}
