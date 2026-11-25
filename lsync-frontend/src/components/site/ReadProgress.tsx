"use client";

import { useEffect, useRef } from "react";

/** A thin bar under the header that fills as you read the article. */
export function ReadProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const done = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
      bar.current?.style.setProperty("--p", String(done));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [targetId]);
  return (
    <div className="sticky top-16 z-30 h-1 w-full bg-black/5" aria-hidden>
      <div ref={bar} className="read-progress h-full w-full bg-primary" />
    </div>
  );
}
