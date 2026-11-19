"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LogsProvider } from "@/lib/logs/LogsProvider";

/** Same sign-in guard as the app shell, for full-width pages that have no sidebar (the "link your sources" step). */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);
  if (status !== "authenticated") {
    return (
      <div className="grid min-h-dvh place-items-center bg-page" role="status" aria-label="Loading your account">
        <div className="size-10 animate-spin rounded-full border-4 border-lilac border-t-primary" />
      </div>
    );
  }
  return <LogsProvider>{children}</LogsProvider>;
}
