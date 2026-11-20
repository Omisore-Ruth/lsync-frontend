"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/AuthCard";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { PasswordMeter } from "@/components/ui/PasswordMeter";
import { SlowHint } from "@/components/ui/SlowHint";
import { TextField } from "@/components/ui/TextField";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirm: z.string().min(1, "Type the password again."),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The two passwords don't match." });
type Values = z.infer<typeof schema>;

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const password = useWatch({ control, name: "password" }) ?? "";

  async function onSubmit(v: Values) {
    setServerError(null);
    try {
      await api(endpoints.resetPassword, { method: "POST", body: { token, newPassword: v.password }, auth: false });
      setDone(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-5">
        <Banner tone="warn">This reset link is missing its code. Open the link from your email again, or request a new one.</Banner>
        <Link href="/forgot-password" className="text-base font-bold text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <div className="pop flex size-14 items-center justify-center rounded-full bg-success-soft" style={{ "--i": 0 } as React.CSSProperties}>
          <CheckCircle2 className="size-7 text-success" aria-hidden />
        </div>
        <p className="text-base text-body">Your password has been updated. You can sign in with it now.</p>
        <Link href="/login" className="inline-flex justify-center rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white hover:bg-primary-hover">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <FormAlert message={serverError}>
        {serverError && (
          <Link href="/forgot-password" className="mt-1 block font-bold underline">
            Request a new link
          </Link>
        )}
      </FormAlert>
      <TextField label="New password" type="password" autoComplete="new-password" hint="Use at least 8 characters with a mix of letters and numbers." error={errors.password?.message} {...register("password")} />
      <PasswordMeter value={password} />
      <TextField label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Save new password
      </Button>
      {isSubmitting && <SlowHint />}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" subtitle="Pick something you haven't used on other sites.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthCard>
  );
}
