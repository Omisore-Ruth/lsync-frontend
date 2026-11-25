"use client";

import { openLily } from "@/components/site/SiteHeader";

export function AskLilyLink() {
  return (
    <button type="button" onClick={openLily} className="text-left hover:text-ink hover:underline">
      Ask Lily
    </button>
  );
}
