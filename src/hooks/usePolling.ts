import { useEffect, useRef, useState } from "react";

interface PollingState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: number | null;
  isPolling: boolean;
  tick: number;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number = 3000,
  enabled: boolean = true
): PollingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);
  const fetchRef = useRef(fetchFn);

  // Keep the latest fetch function reference without re-creating the interval
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        setIsPolling(true);
        const result = await fetchRef.current();
        if (!cancelled) {
          // Always replace the data reference so React re-renders even if
          // the polled payload is structurally identical to the previous one.
          setData(result);
          setError(null);
          setLastUpdated(Date.now());
          setTick(t => t + 1);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      } finally {
        if (!cancelled) {
          setIsPolling(false);
        }
      }
    };

    poll();
    intervalId = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalMs, enabled]);

  return { data, loading, error, lastUpdated, isPolling, tick };
}
