"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { SyncDiagram } from "@/components/auth/SyncDiagram";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { USE_MOCKS } from "@/lib/api/endpoints";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/api/mock";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormAlert } from "@/components/ui/FormAlert";
import { TextField } from "@/components/ui/TextField";
import { SlowHint } from "@/components/ui/SlowHint";
import { wakeServer } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { copy } from "@/lib/copy";

const schema = z.object({
  identifier: z.string().trim().min(1, "Enter your email.").email("Enter the email you signed up with."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean(),
});
type Values = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, status } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { remember: false, identifier: params.get("email") ?? "" } });

  // Wake the (sleeping) free server while the person types.
  useEffect(() => {
    wakeServer();
  }, []);

  // Only allow redirects to paths inside this app
  const next = params.get("next");
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  useEffect(() => {
    if (status === "authenticated") router.replace(destination);
  }, [status, destination, router]);

  async function onSubmit(v: Values) {
    setServerError(null);
    try {
      await login(v.identifier, v.password, v.remember);
      router.replace(destination);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {USE_MOCKS && (
        <Banner tone="info">
          <strong>Demo mode.</strong> Sign in with <code className="font-bold">{DEMO_EMAIL}</code> and <code className="font-bold">{DEMO_PASSWORD}</code>, or create a new account to see the empty first-time experience.
        </Banner>
      )}
      <FormAlert message={params.get("expired") ? "Your session ended. Please sign in again." : serverError} />
      <TextField className="rise" style={{ "--i": 3 } as React.CSSProperties} label="Email" type="email" autoComplete="email" autoCapitalize="none" placeholder="you@example.com" error={errors.identifier?.message} {...register("identifier")} />
      <TextField className="rise" style={{ "--i": 4 } as React.CSSProperties} label="Password" type="password" autoComplete="current-password" placeholder="Your password" error={errors.password?.message} {...register("password")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox {...register("remember")}>Keep me signed in</Checkbox>
        <Link href="/forgot-password" className="text-base font-bold text-primary underline-offset-2 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={isSubmitting} style={{ "--i": 5 } as React.CSSProperties} className="rise w-full">
        Sign in
      </Button>
      {isSubmitting && <SlowHint />}
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh grid-cols-1 gap-6 bg-page p-4 lg:grid-cols-[1.05fr_1fr] lg:p-3">
      <section className="flex flex-col px-2 py-4 sm:px-8 lg:px-12">
        <div className="rise self-start"><Link href="/" aria-label="LSync home"><Logo className="h-11 sm:h-12" /></Link></div>
        <div style={{ "--i": 1 } as React.CSSProperties} className="rise mx-auto my-8 w-full max-w-[520px] rounded-[28px] border-[1.5px] border-peach bg-card p-7 sm:p-10 lg:my-auto">
          <h1 className="text-3xl font-bold text-ink sm:text-4xl">Welcome back</h1>
          <p className="mb-8 mt-3 text-base text-body">{copy.signInSubtitle}</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-body">
            New to LSync?{" "}
            <Link href="/register" className="font-bold text-orange-link underline-offset-2 hover:underline">
              Create an account
            </Link>
          </p>
          <p className="my-4 text-center text-sm font-bold text-ink">OR</p>
          <SocialButtons />
          <p className="mt-6 text-center text-sm text-muted">
            <Link href="/" className="font-semibold underline-offset-2 hover:underline">About LSync</Link> · <Link href="/blog" className="font-semibold underline-offset-2 hover:underline">Read the blog</Link>
          </p>
        </div>
      </section>

      <aside className="relative hidden flex-col items-center justify-between overflow-hidden rounded-[28px] bg-violet-deep px-10 py-14 lg:flex">
        <div className="flex w-full flex-1 items-center justify-center">
          <SyncDiagram />
        </div>
        <p style={{ "--i": 6 } as React.CSSProperties} className="rise w-full max-w-[520px] rounded-3xl border border-white/20 bg-white/15 p-7 text-xl font-medium leading-snug text-white backdrop-blur">
          {copy.signInTagline}
        </p>
      </aside>
    </main>
  );
}
