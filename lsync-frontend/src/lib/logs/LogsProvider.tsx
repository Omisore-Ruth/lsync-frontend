"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createLog, deleteLog, listLogs } from "@/lib/api/services";
import type { LearningLog, NewLog } from "@/lib/types";

type Status = "loading" | "ready" | "error";

type Value = {
  logs: LearningLog[];
  status: Status;
  error?: string;
  /** "Now" for every calculation, fixed per page load so numbers don't jitter. */
  today: Date;
  reload: () => Promise<void>;
  add: (input: NewLog) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const LogsContext = createContext<Value | null>(null);

/** Loads the learner's logs once and shares them with every page (dashboard, skills, analytics, activity...). */
export function LogsProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LearningLog[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string>();
  const [today, setToday] = useState(() => new Date());

  const fetchLogs = useCallback(async () => {
    try {
      const data = await listLogs();
      setLogs(data);
      setError(undefined);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load your learning logs.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void fetchLogs();
  }, [fetchLogs]);

  const reload = useCallback(async () => {
    setStatus("loading");
    setToday(new Date());
    await fetchLogs();
  }, [fetchLogs]);

  const add = useCallback(
    async (input: NewLog) => {
      await createLog(input);
      await fetchLogs();
    },
    [fetchLogs],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    },
    [],
  );

  const value = useMemo(() => ({ logs, status, error, today, reload, add, remove }), [logs, status, error, today, reload, add, remove]);
  return <LogsContext.Provider value={value}>{children}</LogsContext.Provider>;
}

export function useLogs() {
  const ctx = useContext(LogsContext);
  if (!ctx) throw new Error("useLogs must be used inside <LogsProvider>");
  return ctx;
}
