// Fetches JSON from Doorlist's API and fetches it again every few seconds,
// so a generated answer keeps showing the current figures.
import { useEffect, useState } from "react";

export function useLive<T>(url: string, everyMs = 3000): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let stopped = false;
    const load = () =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!stopped) setData(d); });
    void load();
    const timer = setInterval(load, everyMs);
    return () => { stopped = true; clearInterval(timer); };
  }, [url, everyMs]);
  return data;
}

export function query(params: Record<string, string | number | string[] | null | undefined>) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    q.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return q.toString();
}
