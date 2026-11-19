"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = { id: string; data?: T; error?: string };

/**
 * Runs an async loader on mount (and whenever `deps` change) and reports loading / error / data.
 * `reload()` runs it again. Loading is derived (not stored), so no setState happens synchronously in the effect.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<State<T>>({ id: "" });
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  const id = `${tick}:${JSON.stringify(deps)}`;

  useEffect(() => {
    let cancelled = false;
    loaderRef.current().then(
      (data) => !cancelled && setState({ id, data }),
      (e: unknown) => !cancelled && setState({ id, error: e instanceof Error ? e.message : "Something went wrong." }),
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const settled = state.id === id;
  return {
    data: state.data,
    error: settled ? state.error : undefined,
    loading: !settled,
    reload,
  };
}
