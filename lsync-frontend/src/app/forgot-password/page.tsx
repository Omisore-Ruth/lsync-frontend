"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/AuthCard";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { SlowHint } from "@/components/ui/SlowHint";
import { TextField } from "@/components/ui/TextField";
import { api, ApiError, wakeServer } from "@/lib/api/client";
import { endpoints, USE_MOCKS } from "@/lib/api/endpoints";

const schema = z.object({ email: z.string().trim().email("Enter a valid email address.") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Wake the (sleeping) free server while the person types their email.
  useEffect(() => {
    wakeServer();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(v: Values) {
    setServerError(null);
    try {
      const data = await api<{ demoToken?: string | null }>(endpoints.forgotPassword, { method: "POST", body: { email: v.email }, auth: false, timeoutMs: 25000 });
      setDemoToken(USE_MOCKS ? (data?.demoToken ?? null) : null);
      setSentTo(v.email);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setServerError(process.env.NODE_ENV !== "production" ? "Password reset isn't switched on for the server yet. Ask the backend team to add it." : "We can't send reset emails right now. Please try again later.");
      } else if (e instanceof ApiError && e.status === 0 && /longer than usual/i.test(e.message)) {
        setServerError("We couldn't confirm that the email was sent. If it doesn't arrive in a few minutes (check your spam folder too), please try again.");
      } else {
        setServerError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    }
  }

  if (sentTo) {
    return (
      <AuthCard title="Check your email">
        <div className="mt-6 flex flex-col gap-5">
          <div className="pop flex size-14 items-center justify-center rounded-full bg-lilac-soft" style={{ "--i": 0 } as React.CSSProperties}>
            <MailCheck className="size-7 text-indigo-brand" aria-hidden />
          </div>
          <p className="text-base text-body">
            If an account exists for <strong className="text-ink">{sentTo}</strong>, we&apos;ve sent a link to reset the password. It can take a few minutes to arrive, so check your spam folder too.
          </p>
          {USE_MOCKS && demoToken && (
            <Banner tone="info">
              <strong>Demo mode.</strong> No real email is sent. <Link href={`/reset-password?token=${encodeURIComponent(demoToken)}`} className="font-bold underline">Open the reset link</Link>.
            </Banner>
          )}
          <Link href="/login" className="text-base font-bold text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter the email you signed up with and we'll send you a link to choose a new one.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <FormAlert message={serverError} />
        <TextField label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
        {isSubmitting && <SlowHint />}
        <p className="text-center text-sm text-body">
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
