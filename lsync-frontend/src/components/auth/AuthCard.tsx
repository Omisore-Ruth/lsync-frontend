import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

/** Centered card used by the password pages (same look as the sign-in card). */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-page p-4 sm:p-8">
      <div className="rise flex justify-center">
        <Logo className="h-10 sm:h-11" />
      </div>
      <div style={{ "--i": 1 } as React.CSSProperties} className="rise mx-auto my-8 w-full max-w-[520px] rounded-[28px] border-[1.5px] border-peach bg-card p-7 sm:p-10 lg:my-auto">
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        {subtitle && <p className="mb-8 mt-3 text-base text-body">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}
