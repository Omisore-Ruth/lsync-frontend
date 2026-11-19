"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageHeader } from "@/components/shell/PageHeader";
import { Banner, EmptyState, Loading } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormAlert } from "@/components/ui/FormAlert";
import { SelectField } from "@/components/ui/SelectField";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { TextField } from "@/components/ui/TextField";
import { relativeDay } from "@/lib/activity";
import { useLogs } from "@/lib/logs/LogsProvider";
import { PLATFORM_OPTIONS, TRACK_SUGGESTIONS } from "@/lib/sources";
import { dayKey, fmtDuration, keyOf } from "@/lib/stats";
import type { LearningLog } from "@/lib/types";

const makeSchema = (todayKey: string) =>
  z
    .object({
      skill: z.string().trim().min(2, "Enter the skill you practised."),
      platform: z.string().min(1, "Choose where you learned it."),
      track: z.string().trim().optional(),
      date: z.string().min(1, "Pick the date.").refine((d) => d <= todayKey, "The date can't be in the future."),
      hours: z.string().regex(/^\d{0,2}$/, "Use whole numbers."),
      minutes: z.string().regex(/^\d{0,2}$/, "Use whole numbers."),
    })
    .superRefine((v, ctx) => {
      const h = Number(v.hours || 0);
      const m = Number(v.minutes || 0);
      if (m > 59) ctx.addIssue({ code: "custom", path: ["minutes"], message: "Minutes must be 0 to 59." });
      else if (h * 60 + m < 1) ctx.addIssue({ code: "custom", path: ["minutes"], message: "Enter how long you learned." });
      else if (h * 60 + m > 24 * 60) ctx.addIssue({ code: "custom", path: ["minutes"], message: "That's more than a day. Split it across days." });
    });
type Values = z.infer<ReturnType<typeof makeSchema>>;

function LogForm({ initialPlatform, onDone, onCancel }: { initialPlatform: string; onDone: () => void; onCancel: () => void }) {
  const { add, today } = useLogs();
  const todayKey = keyOf(today);
  const schema = useMemo(() => makeSchema(todayKey), [todayKey]);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { skill: "", platform: initialPlatform, track: "", date: todayKey, hours: "", minutes: "" } });

  async function onSubmit(v: Values) {
    setServerError(null);
    try {
      await add({ skill: v.skill, platform: v.platform, track: v.track || undefined, date: v.date, durationMinutes: Number(v.hours || 0) * 60 + Number(v.minutes || 0) });
      onDone();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "We couldn't save that log.");
    }
  }

  return (
    <Card title="Add a learning log" subtitle="Record time you spent learning. It counts towards your dashboard, skills and analytics.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormAlert message={serverError} />
        </div>
        <TextField label="Skill" placeholder="For example: SQL" error={errors.skill?.message} {...register("skill")} />
        <SelectField label="Where did you learn it?" placeholder="Choose a platform" options={PLATFORM_OPTIONS} error={errors.platform?.message} {...register("platform")} />
        <div>
          <TextField label="Track (optional)" placeholder="For example: Data" list="track-suggestions" error={errors.track?.message} {...register("track")} />
          <datalist id="track-suggestions">
            {TRACK_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <TextField label="Date" type="date" max={todayKey} error={errors.date?.message} {...register("date")} />
        <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:max-w-sm">
          <TextField label="Hours" inputMode="numeric" placeholder="0" maxLength={2} {...register("hours")} error={errors.hours?.message} />
          <TextField label="Minutes" inputMode="numeric" placeholder="45" maxLength={2} error={errors.minutes?.message} {...register("minutes")} />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" loading={isSubmitting}>
            Save log
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

const PAGE = 25;

function Logs() {
  const params = useSearchParams();
  const { logs, status, error, reload, remove, today } = useLogs();
  const [formOpen, setFormOpen] = useState(params.get("add") === "1");
  const [saved, setSaved] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [toDelete, setToDelete] = useState<LearningLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sorted = useMemo(() => [...logs].sort((a, b) => dayKey(b.date).localeCompare(dayKey(a.date))), [logs]);

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
      <PageHeader title="Learning logs">
        {!formOpen && (
          <Button type="button" onClick={() => { setFormOpen(true); setSaved(false); }} className="!py-2.5">
            <Plus className="size-4" aria-hidden /> Add log
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-4">
        {saved && !formOpen && <Banner tone="success">Log saved. It now counts towards your dashboard.</Banner>}
        {formOpen && (
          <LogForm
            initialPlatform={params.get("platform") ?? ""}
            onDone={() => { setFormOpen(false); setSaved(true); }}
            onCancel={() => setFormOpen(false)}
          />
        )}

        {status === "loading" && <Loading label="Loading your logs" />}
        {status === "error" && (
          <Banner tone="error" action={<Button type="button" variant="outline" onClick={() => void reload()} className="!px-4 !py-2 !text-sm">Try again</Button>}>
            {error}
          </Banner>
        )}
        {status === "ready" && sorted.length === 0 && !formOpen && (
          <EmptyState title="No learning logs yet" text="Add the time you spend learning, from courses, videos or reading, and your progress will start to build up.">
            <Button type="button" onClick={() => setFormOpen(true)}>
              <Plus className="size-4" aria-hidden /> Add your first log
            </Button>
          </EmptyState>
        )}

        {status === "ready" && sorted.length > 0 && (
          <section aria-label="Your learning logs" className="rounded-2xl bg-white">
            <ul className="divide-y divide-black/5">
              {sorted.slice(0, shown).map((l) => (
                <li key={l.id} className="flex items-center gap-4 px-5 py-4">
                  <SourceBadge name={l.platform} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{l.skill}</p>
                    <p className="truncate text-sm text-muted">{[l.platform, l.track].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">{fmtDuration(l.durationMinutes)}</p>
                    <p className="text-sm text-muted">{relativeDay(dayKey(l.date), today)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDeleteError(null); setToDelete(l); }}
                    aria-label={`Delete log: ${l.skill}, ${fmtDuration(l.durationMinutes)}, ${relativeDay(dayKey(l.date), today)}`}
                    className="grid size-11 shrink-0 place-items-center rounded-lg text-body hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="size-5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            {sorted.length > shown && (
              <div className="border-t border-black/5 p-4 text-center">
                <Button type="button" variant="outline" onClick={() => setShown((n) => n + PAGE)} className="!py-2.5">
                  Show more ({sorted.length - shown} left)
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      <ConfirmDialog open={toDelete !== null} title="Delete this log?" confirmLabel="Delete log" danger busy={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)}>
        {toDelete && (
          <>
            <p>
              {toDelete.skill} on {toDelete.platform}, {fmtDuration(toDelete.durationMinutes)}. This can&apos;t be undone, and your totals will change.
            </p>
            {deleteError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{deleteError}</p>}
          </>
        )}
      </ConfirmDialog>
    </>
  );
}

export default function LearningLogsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Logs />
    </Suspense>
  );
}
