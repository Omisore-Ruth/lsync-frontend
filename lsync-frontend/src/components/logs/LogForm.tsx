"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormAlert } from "@/components/ui/FormAlert";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { useLogs } from "@/lib/logs/LogsProvider";
import { PLATFORM_OPTIONS, TRACK_SUGGESTIONS } from "@/lib/sources";
import { keyOf } from "@/lib/stats";

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

export function LogForm({ initialPlatform, onDone, onCancel }: { initialPlatform: string; onDone: () => void; onCancel: () => void }) {
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

