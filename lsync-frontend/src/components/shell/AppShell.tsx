"use client";

import { Activity, ChartColumn, LayoutDashboard, LogOut, Menu, Target, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { signOutState, useAuth } from "@/lib/auth/AuthProvider";
import { USE_MOCKS } from "@/lib/api/endpoints";
import { LogsProvider } from "@/lib/logs/LogsProvider";
import { Avatar } from "@/components/ui/Avatar";
import { useAvatar } from "@/lib/avatar";

// Exactly Dan's menu. Adding logs lives inside Activity, linking sources lives on the Dashboard,
// and peer insights is reached from the glowing orb on the Dashboard (so it is not listed here).
const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/skills", label: "Skills", icon: Target },
  { href: "/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/** Sidebar on desktop, slide-in drawer on mobile. Also the route guard for everything inside. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  // The drawer is "open for" one pathname, so it closes by itself when the route changes.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const photo = useAvatar((user?.id as string | undefined) ?? user?.email ?? user?.username);
  const open = openFor === pathname;
  const setOpen = (v: boolean) => setOpenFor(v ? pathname : null);

  // A deliberate log out goes to a clean /login; only a lost/expired session carries "next" and a notice.
  const loggingOut = useRef(false);

  useEffect(() => {
    if (status === "anonymous" && !loggingOut.current && !signOutState.deliberate) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div className="grid min-h-dvh place-items-center bg-page" role="status" aria-label="Loading your account">
        <div className="size-10 animate-spin rounded-full border-4 border-lilac border-t-primary" />
      </div>
    );
  }

  const name = user?.fullName || user?.username || "Your account";

  const sidebar = (
    <div className="flex h-full flex-col bg-plum px-5 py-6 text-white">
      <Link href="/dashboard" className="mb-8 ml-1 block self-start rounded-xl bg-white px-2.5 py-1.5" aria-label="LSync dashboard">
        <Logo className="h-9" />
      </Link>
      <nav aria-label="Main" className="flex flex-col gap-1.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                active ? "bg-lilac-soft text-indigo-brand" : "text-white/90 hover:bg-white/10"
              }`}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        <Link href="/profile" className="flex items-center gap-3 rounded-2xl bg-white/15 p-3 hover:bg-white/20">
          <Avatar name={user?.fullName ?? user?.username} src={photo} className="size-11 text-sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{name}</span>
            <span className="block text-sm text-white">Profile and settings</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => {
            loggingOut.current = true;
            logout();
            router.replace("/login");
          }}
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-white/90 hover:bg-white/10"
        >
          <LogOut className="size-5" aria-hidden />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <LogsProvider>
    <div className="min-h-dvh bg-page lg:grid lg:grid-cols-[280px_1fr] lg:gap-4 lg:p-3">
      <aside className="sticky top-3 hidden h-[calc(100dvh-1.5rem)] overflow-hidden rounded-3xl lg:block">{sidebar}</aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between bg-plum px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="rounded-lg bg-white px-2.5 py-1.5" aria-label="LSync dashboard">
          <Logo className="h-7" />
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="grid size-11 place-items-center rounded-lg text-white hover:bg-white/10">
          <Menu className="size-6" aria-hidden />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative h-full w-[290px] max-w-[85vw]">
            {sidebar}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 grid size-10 place-items-center rounded-lg text-white hover:bg-white/10">
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 p-4 sm:p-6 lg:p-5">
        {USE_MOCKS && (
          <p className="mb-4 inline-flex rounded-full bg-warn-soft px-3 py-1 text-xs font-bold text-[#7a4a00]">Demo mode: what you add stays in this browser</p>
        )}
        {children}
      </main>
    </div>
    </LogsProvider>
  );
}
