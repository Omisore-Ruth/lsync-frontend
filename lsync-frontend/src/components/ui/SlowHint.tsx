"use client";

import { useEffect, useState } from "react";

/** Shown under a submit button that has been waiting a while (a sleeping server can take up to a minute to wake). */
export function SlowHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 5000);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <p role="status" className="text-center text-sm text-body">
      Still working. This can take a little longer the first time, thank you for waiting.
    </p>
  );
}
