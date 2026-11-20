"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormAlert } from "@/components/ui/FormAlert";
import { PasswordMeter } from "@/components/ui/PasswordMeter";
import { TextField } from "@/components/ui/TextField";
import { changePassword } from "@/lib/api/services";

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(8, "Use at least 8 characters.").regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Include at least one letter and one number."),
    confirm: z.string().min(1, "Type the new password again."),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "The two passwords don't match." })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Choose a password you haven't used here before." });
type Values = z.infer<typeof schema>;

export function ChangePasswordCard() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { current: "", next: "", confirm: "" } });
  const next = useWatch({ control, name: "next" }) ?? "";

  async function onSubmit(v: Values) {
    setServerError(null);
    setDone(false);
    try {
      await changePassword(v.current, v.next);
      reset();
      setDone(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "We couldn't change your password.");
    }
  }

  return (
    <Card title="Change password" subtitle="Use your current password to choose a new one.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid max-w-md gap-4">
        {done && <Banner tone="success">Password updated. Use it the next time you sign in.</Banner>}
        <FormAlert message={serverError} />
        <TextField label="Current password" type="password" autoComplete="current-password" error={errors.current?.message} {...register("current")} />
        <div>
          <TextField label="New password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." error={errors.next?.message} {...register("next")} />
          <PasswordMeter value={next} />
        </div>
        <TextField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
        <div>
          <Button type="submit" loading={isSubmitting} className="!py-2.5 text-sm">
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
