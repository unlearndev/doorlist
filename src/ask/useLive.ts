// Fetches JSON from Doorlist's API and fetches it again every few seconds,
// so a generated answer keeps showing the current figures. `failed` is the
// status code (or 0 when Doorlist couldn't be reached) of the last try.
import { useEffect, useState } from "react";

export function useLive<T>(url: string, everyMs = 3000): { data: T | null; failed: number | null } {
  const [result, setResult] = useState<{ data: T | null; failed: number | null }>({ data: null, failed: null });
  useEffect(() => {
    let stopped = false;
    const load = async () => {
      try {
        const res = await fetch(url);
        const next = res.ok ? { data: (await res.json()) as T, failed: null } : { data: null, failed: res.status };
        if (!stopped) setResult(next);
      } catch {
        if (!stopped) setResult((r) => ({ data: r.data, failed: 0 }));
      }
    };
    void load();
    const timer = setInterval(load, everyMs);
    return () => { stopped = true; clearInterval(timer); };
  }, [url, everyMs]);
  return result;
}

export function query(params: Record<string, string | number | string[] | null | undefined>) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    q.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return q.toString();
}
