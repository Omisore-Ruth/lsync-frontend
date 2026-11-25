"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2200);
    } catch {
      /* the person closed the share sheet, or the browser blocked copying */
    }
  }
  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-xl border border-peach bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-peach-soft">
      {done ? <Check className="size-4 text-success" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      <span aria-live="polite">{done ? "Link copied" : "Share this article"}</span>
    </button>
  );
}
