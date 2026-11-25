"use client";

import { useEffect, useRef } from "react";

const SESSION_KEY = "lsync-preloaded";
const MIN_VISIBLE_MS = 1300; // long enough for the full logo sequence (about 1.2s) to finish
const MIN_VISIBLE_REDUCED_MS = 400;
const MAX_VISIBLE_MS = 2500; // never block the app longer than this

/**
 * Full-screen logo animation shown once per browser session.
 *
 * - The markup is server-rendered, so it is painted with the first HTML, before any JS loads.
 * - An inline script in <head> (see PRELOAD_SCRIPT) adds `no-preload` to <html> when the
 *   preloader already ran this session, so returning navigations never flash it.
 * - It leaves once the minimum time has passed. It does not wait for every image and script on the page to finish
 *   (the old "load" wait made slow connections stare at the logo for seconds). The page is already interactive by then.
 */
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (document.documentElement.classList.contains("no-preload")) {
      el.setAttribute("data-done", "true");
      document.documentElement.classList.add("ready");
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minMs = reduced ? MIN_VISIBLE_REDUCED_MS : MIN_VISIBLE_MS;
    const start = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      el.setAttribute("data-done", "true");
      // Page entrance animations are held until now (see globals.css), so they play when the logo screen leaves.
      document.documentElement.classList.add("ready");
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* storage can be blocked; the preloader just shows again next visit */
      }
    };

    const wait = Math.max(0, minMs - (performance.now() - start));
    const timer = window.setTimeout(finish, wait);
    const hardStop = window.setTimeout(finish, MAX_VISIBLE_MS);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hardStop);
    };
  }, []);

  return (
    <div id="preloader" ref={ref} role="status" aria-label="Loading LSync">
      <div className="pl-logo" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pl-mark" src="/brand/logo-mark.webp" alt="" width={360} height={336} decoding="async" fetchPriority="high" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pl-word" src="/brand/logo-wordmark.webp" alt="" width={640} height={203} decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pl-tag" src="/brand/logo-tagline.webp" alt="" width={640} height={42} decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pl-bar" src="/brand/logo-bar.webp" alt="" width={355} height={13} decoding="async" />
      </div>
    </div>
  );
}

/** Runs before first paint (inline in <head>) to skip the preloader on repeat visits in a session. */
export const PRELOAD_SCRIPT = `try{if(sessionStorage.getItem("${SESSION_KEY}"))document.documentElement.classList.add("no-preload","ready")}catch(e){}`;
