// Queries and figures for shows. Every number Doorlist shows is worked out
// here, from the orders and tiers, never typed in anywhere else.
import { TODAY, daysBetween, addDays } from "./clock.ts";
import { db } from "./db.ts";
import type { Show } from "./data/seed.ts";

export type Pace = "ahead" | "on_track" | "behind" | "sold_out";

export type ShowStats = {
  id: string;
  title: string;
  date: string;
  daysToShow: number;
  capacity: number;
  sold: number;
  sellThrough: number; // 0..1
  revenuePence: number;
  lastSevenDays: number;
  expectedSellThrough: number; // where a typical show is by now
  pace: Pace;
};

export function findShow(id: string): Show | undefined {
  return db.shows.find((s) => s.id === id);
}

export function upcomingShows(): Show[] {
  return db.shows.filter((s) => s.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date));
}

// A typical Kestrel Rooms show has sold this share of its tickets by the
// time it's this many days away (from the last two years of shows).
export function expectedSellThrough(daysToShow: number): number {
  if (daysToShow <= 0) return 0.95;
  if (daysToShow <= 7) return 0.85;
  if (daysToShow <= 14) return 0.75;
  if (daysToShow <= 28) return 0.6;
  if (daysToShow <= 42) return 0.45;
  return 0.3;
}

export function statsFor(show: Show): ShowStats {
  const capacity = show.tiers.reduce((n, t) => n + t.capacity, 0);
  const sold = show.tiers.reduce((n, t) => n + t.sold, 0);
  const revenuePence = show.tiers.reduce((n, t) => n + t.sold * t.pricePence, 0);
  const weekAgo = addDays(TODAY, -7);
  const lastSevenDays = show.dailySales
    .filter((d) => d.date >= weekAgo && d.date < TODAY)
    .reduce((n, d) => n + d.tickets, 0);
  const daysToShow = daysBetween(TODAY, show.date);
  const sellThrough = capacity ? sold / capacity : 0;
  const expected = expectedSellThrough(daysToShow);
  let pace: Pace = "on_track";
  if (sold >= capacity) pace = "sold_out";
  else if (sellThrough < expected - 0.1) pace = "behind";
  else if (sellThrough > expected + 0.1) pace = "ahead";
  return {
    id: show.id,
    title: show.title,
    date: show.date,
    daysToShow,
    capacity,
    sold,
    sellThrough: Math.round(sellThrough * 1000) / 1000,
    revenuePence,
    lastSevenDays,
    expectedSellThrough: expected,
    pace,
  };
}

export function venueTotals() {
  const upcoming = upcomingShows().map(statsFor);
  const thisMonth = TODAY.slice(0, 7);
  const nextMonth = addDays(`${thisMonth}-01`, 32).slice(0, 7);
  const sum = (rows: ShowStats[], key: "sold" | "revenuePence" | "capacity" | "lastSevenDays") =>
    rows.reduce((n, r) => n + r[key], 0);
  const inMonth = (m: string) => upcoming.filter((r) => r.date.startsWith(m));
  return {
    upcomingShows: upcoming.length,
    ticketsSoldLastSevenDays: sum(upcoming, "lastSevenDays"),
    thisMonth: {
      month: thisMonth,
      shows: inMonth(thisMonth).length,
      sold: sum(inMonth(thisMonth), "sold"),
      capacity: sum(inMonth(thisMonth), "capacity"),
      revenuePence: sum(inMonth(thisMonth), "revenuePence"),
    },
    nextMonth: {
      month: nextMonth,
      shows: inMonth(nextMonth).length,
      sold: sum(inMonth(nextMonth), "sold"),
      capacity: sum(inMonth(nextMonth), "capacity"),
      revenuePence: sum(inMonth(nextMonth), "revenuePence"),
    },
    showsBehind: upcoming.filter((r) => r.pace === "behind").length,
  };
}

// The shows an answer asks for, filtered and sorted by Doorlist.
export type ShowQuery = {
  month?: string | null; // YYYY-MM
  pace?: Pace | null;
  layout?: "standing" | "seated" | null;
  ids?: string[] | null;
  sort?: "date" | "sellThrough" | "lastSevenDays" | null;
  limit?: number | null;
};

export function queryShows(query: ShowQuery): ShowStats[] {
  let rows = upcomingShows()
    .filter((s) => !query.month || s.date.startsWith(query.month))
    .filter((s) => !query.layout || s.layout === query.layout)
    .filter((s) => !query.ids?.length || query.ids.includes(s.id))
    .map(statsFor)
    .filter((r) => !query.pace || r.pace === query.pace);
  if (query.sort === "sellThrough") rows = rows.sort((a, b) => a.sellThrough - b.sellThrough);
  if (query.sort === "lastSevenDays") rows = rows.sort((a, b) => a.lastSevenDays - b.lastSevenDays);
  if (query.limit) rows = rows.slice(0, query.limit);
  return rows;
}

// One headline figure, worked out by Doorlist, for a month or a show.
export const METRICS = ["ticketsSold", "capacity", "sellThrough", "revenue", "lastSevenDays", "showsBehind", "shows"] as const;
export type Metric = (typeof METRICS)[number];
export type Figure = { value: number; format: "number" | "pounds" | "percent" };

export function figure(metric: Metric, scope: { month?: string | null; showId?: string | null }): Figure {
  const rows = queryShows({ month: scope.month, ids: scope.showId ? [scope.showId] : null });
  const sum = (key: "sold" | "capacity" | "revenuePence" | "lastSevenDays") => rows.reduce((n, r) => n + r[key], 0);
  switch (metric) {
    case "ticketsSold": return { value: sum("sold"), format: "number" };
    case "capacity": return { value: sum("capacity"), format: "number" };
    case "sellThrough": return { value: sum("capacity") ? sum("sold") / sum("capacity") : 0, format: "percent" };
    case "revenue": return { value: sum("revenuePence"), format: "pounds" };
    case "lastSevenDays": return { value: sum("lastSevenDays"), format: "number" };
    case "showsBehind": return { value: rows.filter((r) => r.pace === "behind").length, format: "number" };
    case "shows": return { value: rows.length, format: "number" };
  }
}
