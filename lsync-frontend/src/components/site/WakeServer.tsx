"use client";

import { useEffect } from "react";
import { wakeServer } from "@/lib/api/client";

/** The free server sleeps when idle and can take a minute to wake. Knocking while someone reads the home page means it is awake by the time they sign in. */
export function WakeServer() {
  useEffect(() => {
    wakeServer();
  }, []);
  return null;
}
