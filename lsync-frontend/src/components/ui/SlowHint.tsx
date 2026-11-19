"use client";

import { useEffect, useState } from "react";

/** Shown under a submit button that has been waiting a while (the free server may be waking up). */
export function SlowHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 5000);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <p role="status" className="text-center text-sm text-body">
      Still working. The server may be waking up, and the first request can take up to a minute.
    </p>
  );
}
