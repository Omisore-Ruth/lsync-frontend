"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { PasswordMeter } from "@/components/ui/PasswordMeter";
import { FormAlert } from "@/components/ui/FormAlert";
import { TextField } from "@/components/ui/TextField";
import { SlowHint } from "@/components/ui/SlowHint";
import { wakeServer } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  username: z
    .string()
    .trim()
    .min(5, "Use at least 5 characters.")
    .max(30, "Use 30 characters or fewer.")
    .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers and underscores."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/\d/, "Include at least one number."),
  terms: z.boolean().refine((v) => v, "You need to agree to continue."),
});
type Values = z.infer<typeof schema>;

const benefits = [
  "Link to your learning platform in one click.",
  "See your total progress, skill and growth on one dashboard.",
  "Share a public portfolio and choose exactly what others can see.",
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: signUp, status } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);

  // Wake the (sleeping) free server while the person fills in the form.
  useEffect(() => {
    wakeServer();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { terms: false } });

  const password = useWatch({ control, name: "password" }) ?? "";

  // Subtle pointer parallax on the artwork: sets two CSS variables, no re-render.
  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
    e.currentTarget.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
  }

  // Someone who is already signed in and opens /register goes straight to the dashboard.
  // A brand-new sign-up goes to "Link your learning sources" instead (the order in Dan's Figma flow).
  const [justRegistered, setJustRegistered] = useState(false);
  useEffect(() => {
    if (status === "authenticated" && !justRegistered) router.replace("/dashboard");
  }, [status, justRegistered, router]);

  async function onSubmit(v: Values) {
    setServerError(null);
    setExists(false);
    setJustRegistered(true);
    try {
      await signUp({ fullName: v.fullName, username: v.username.toLowerCase(), email: v.email, password: v.password });
      router.replace("/connect");
    } catch (e) {
      setJustRegistered(false);
      const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setExists(/already|exist|taken|registered|duplicate/i.test(msg));
      setServerError(msg);
    }
  }

  return (
    <main className="grid min-h-dvh grid-cols-1 bg-[#f2ede9] lg:grid-cols-2">
      {/* Form side */}
      <section className="relative isolate flex flex-col overflow-hidden px-6 py-6 sm:px-12 lg:px-16">
        <div aria-hidden className="drift absolute -left-40 top-24 -z-10 size-[760px] rounded-full bg-[#f7dcc8]" style={{ "--d": "14s" } as React.CSSProperties} />
        <div aria-hidden className="drift absolute -left-10 top-16 -z-10 size-[620px] rounded-full bg-[#f9cba8]" style={{ "--d": "11s" } as React.CSSProperties} />
        <div aria-hidden className="drift absolute left-20 top-40 -z-10 size-[460px] rounded-full bg-[#ffb584]" style={{ "--d": "8s" } as React.CSSProperties} />
        <div className="rise self-start"><Link href="/" aria-label="LSync home"><Logo className="h-11" /></Link></div>
        <div className="mx-auto my-8 w-full max-w-[440px] lg:my-auto">
          <h1 style={{ "--i": 1 } as React.CSSProperties} className="rise mb-8 text-3xl font-bold text-ink sm:text-4xl">Create account</h1>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <FormAlert message={serverError}>
              {exists && (
                <Link href={`/login?email=${encodeURIComponent(getValues("email"))}`} className="mt-1 block font-bold underline">
                  Already have an account? Sign in instead
                </Link>
              )}
            </FormAlert>
            <TextField className="rise" style={{ "--i": 2 } as React.CSSProperties} label="Full name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
            <TextField className="rise" style={{ "--i": 3 } as React.CSSProperties} label="Username" autoComplete="off" autoCapitalize="none" hint="At least 5 characters: letters, numbers and underscores." error={errors.username?.message} {...register("username")} />
            <TextField className="rise" style={{ "--i": 4 } as React.CSSProperties} label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register("email")} />
            <TextField
              className="rise"
              style={{ "--i": 5 } as React.CSSProperties}
              label="Password"
              type="password"
              autoComplete="new-password"
              hint="Use at least 8 characters with a mix of letters and numbers."
              error={errors.password?.message}
              {...register("password")}
            />
            <PasswordMeter value={password} />
            <Checkbox className="rise" style={{ "--i": 6 } as React.CSSProperties} error={errors.terms?.message} {...register("terms")}>
              {/* Terms / Privacy pages don't exist yet */}I agree to the <strong className="text-violet-deep">Terms</strong> and <strong className="text-violet-deep">Privacy Policy</strong>
            </Checkbox>
            <Button type="submit" loading={isSubmitting} style={{ "--i": 7 } as React.CSSProperties} className="rise mt-2 w-full">
              Sign up
            </Button>
            {isSubmitting && <SlowHint />}
            <p style={{ "--i": 8 } as React.CSSProperties} className="rise text-center text-sm text-body">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-center text-sm text-muted">
              <Link href="/" className="font-semibold underline-offset-2 hover:underline">About LSync</Link> · <Link href="/blog" className="font-semibold underline-offset-2 hover:underline">Read the blog</Link>
            </p>
          </form>
        </div>
      </section>

      {/* Artwork side: text sits on the plain lilac area so it stays readable (fixes the Figma overlap) */}
      <aside onPointerMove={onMove} className="relative hidden overflow-hidden bg-lilac lg:block">
        <div aria-hidden className="drift absolute -right-24 -top-24 size-[420px]" style={{ "--d": "10s" } as React.CSSProperties}><div className="parallax size-full rotate-45 rounded-[56px] bg-indigo-brand" style={{ "--k": 30 } as React.CSSProperties} /></div>
        <div aria-hidden className="drift absolute -bottom-32 right-[-120px] size-[380px]" style={{ "--d": "12s" } as React.CSSProperties}><div className="parallax size-full rotate-45 rounded-[56px] bg-indigo-brand" style={{ "--k": -36 } as React.CSSProperties} /></div>
        <div aria-hidden className="drift absolute -left-28 bottom-24 size-[300px]" style={{ "--d": "8s" } as React.CSSProperties}><div className="parallax size-full rotate-45 rounded-[48px] bg-[#e5d6f6]" style={{ "--k": 22 } as React.CSSProperties} /></div>
        <div className="relative flex h-full items-center px-16">
          <div className="max-w-[420px]">
            <h2 className="rise text-4xl font-bold leading-tight text-ink" style={{ "--i": 3 } as React.CSSProperties}>Everything you learn, finally in one place.</h2>
            <ul className="mt-10 flex flex-col gap-6">
              {benefits.map((b, i) => (
                <li key={b} style={{ "--i": i } as React.CSSProperties} className="slide-in flex items-start gap-4 text-lg text-ink">
                  <span style={{ "--i": i } as React.CSSProperties} className="pop mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-white">
                    <Check className="size-4 text-indigo-brand" strokeWidth={3} aria-hidden />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </main>
  );
}
