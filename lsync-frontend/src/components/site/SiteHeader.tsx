"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/lib/auth/AuthProvider";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/blog", label: "Blog" },
];

/** Opens Lily from anywhere (she listens for this event). */
export const openLily = () => window.dispatchEvent(new Event("lily:open"));

export function SiteHeader() {
  const { status } = useAuth();
  const [open, setOpen] = useState(false);
  const signedIn = status === "authenticated";

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-page/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="LSync home" className="shrink-0">
          <Logo className="h-9" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-body hover:bg-black/5 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <Link href="/dashboard" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink hover:bg-black/5">
                Sign in
              </Link>
              <Link href="/register" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl border border-black/10 bg-white md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-black/5 bg-page px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-1 py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-black/5">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            {signedIn ? (
              <Link href="/dashboard" className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-base font-semibold text-white">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="flex-1 rounded-xl border border-peach bg-white px-4 py-3 text-center text-base font-semibold text-ink">
                  Sign in
                </Link>
                <Link href="/register" className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-base font-semibold text-white">
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
