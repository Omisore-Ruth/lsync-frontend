"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isPublicPath } from "@/lib/lily/paths";

// Lily's code (voice, listening and her answers) is a separate download. It is not needed to read or use a page,
// so it only starts loading once the browser is idle, and never on the signed-in pages where she does not appear.
const LilyAgent = dynamic(() => import("./LilyAgent").then((m) => m.LilyAgent), { ssr: false });

export function LilyLoader() {
  const pathname = usePathname();
  const wanted = isPublicPath(pathname);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!wanted || idle) return;
    const start = () => setIdle(true);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback && w.cancelIdleCallback) {
      const id = w.requestIdleCallback(start, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 1500);
    return () => window.clearTimeout(t);
  }, [wanted, idle]);

  return idle ? <LilyAgent /> : null;
}
