// Seed data for The Kestrel Rooms, a made-up 320-capacity music venue.
// Everything is generated from the table below, with a seeded random number
// generator, so every run (and every recording) starts from the same numbers.
import { TODAY, addDays, daysBetween } from "../clock.ts";

export type Tier = {
  id: string;
  name: string;
  pricePence: number;
  capacity: number;
  sold: number;
};

export type Show = {
  id: string;
  title: string;
  support: string | null;
  date: string; // YYYY-MM-DD
  doors: string; // HH:MM
  onSaleDate: string;
  layout: "standing" | "seated";
  status: "on_sale" | "sold_out";
  tiers: Tier[];
  dailySales: { date: string; tickets: number }[];
};

export type Venue = { id: string; name: string; city: string; capacity: number };

type Plan = {
  id: string;
  title: string;
  support: string | null;
  date: string;
  layout: "standing" | "seated";
  capacity: number;
  sold: number;
  prices: [number, number, number]; // early bird, standard, door, in pence
  onSaleDaysBefore: number;
};

const PLANS: Plan[] = [
  { id: "kr-1104", title: "Juniper Coast", support: "Sorrel", date: "2026-11-04", layout: "standing", capacity: 320, sold: 296, prices: [1400, 1800, 2200], onSaleDaysBefore: 70 },
  { id: "kr-1107", title: "The Night Ferries", support: "Glass Harbour", date: "2026-11-07", layout: "standing", capacity: 320, sold: 320, prices: [1600, 2000, 2400], onSaleDaysBefore: 84 },
  { id: "kr-1112", title: "Halfway Moon", support: null, date: "2026-11-12", layout: "standing", capacity: 320, sold: 141, prices: [1200, 1500, 1800], onSaleDaysBefore: 56 },
  { id: "kr-1114", title: "Cold Water Club", support: "Kite Season", date: "2026-11-14", layout: "standing", capacity: 320, sold: 268, prices: [1500, 1900, 2300], onSaleDaysBefore: 63 },
  { id: "kr-1119", title: "Low Tide Choir", support: null, date: "2026-11-19", layout: "seated", capacity: 180, sold: 88, prices: [1800, 2200, 2600], onSaleDaysBefore: 60 },
  { id: "kr-1121", title: "Marigold Static", support: "Velvet Arcade", date: "2026-11-21", layout: "standing", capacity: 320, sold: 305, prices: [1500, 1900, 2300], onSaleDaysBefore: 77 },
  { id: "kr-1126", title: "Ash & Ember Quartet", support: null, date: "2026-11-26", layout: "seated", capacity: 180, sold: 64, prices: [2000, 2500, 3000], onSaleDaysBefore: 49 },
  { id: "kr-1128", title: "Brightwater Sound System", support: null, date: "2026-11-28", layout: "standing", capacity: 320, sold: 211, prices: [1000, 1400, 1800], onSaleDaysBefore: 56 },
  { id: "kr-1203", title: "Glass Harbour", support: "Sorrel", date: "2026-12-03", layout: "standing", capacity: 320, sold: 52, prices: [1200, 1500, 1800], onSaleDaysBefore: 42 },
  { id: "kr-1205", title: "The Winter Lanterns", support: null, date: "2026-12-05", layout: "standing", capacity: 320, sold: 240, prices: [1600, 2000, 2400], onSaleDaysBefore: 70 },
  { id: "kr-1210", title: "Sorrel", support: null, date: "2026-12-10", layout: "seated", capacity: 180, sold: 38, prices: [1400, 1700, 2000], onSaleDaysBefore: 63 },
  { id: "kr-1212", title: "Kite Season", support: "Halfway Moon", date: "2026-12-12", layout: "standing", capacity: 320, sold: 176, prices: [1300, 1600, 1900], onSaleDaysBefore: 56 },
  { id: "kr-1217", title: "Juniper Coast and Marigold Static: The Winter Double Bill", support: null, date: "2026-12-17", layout: "standing", capacity: 320, sold: 290, prices: [2200, 2600, 3000], onSaleDaysBefore: 84 },
  { id: "kr-1219", title: "Velvet Arcade", support: "Cold Water Club", date: "2026-12-19", layout: "standing", capacity: 320, sold: 97, prices: [1400, 1800, 2200], onSaleDaysBefore: 70 },
  { id: "kr-1222", title: "Christmas Ceilidh with The Fenwick Reelers", support: null, date: "2026-12-22", layout: "standing", capacity: 200, sold: 150, prices: [1200, 1500, 1800], onSaleDaysBefore: 63 },
  { id: "kr-1231", title: "New Year's Eve: Brightwater Sound System", support: null, date: "2026-12-31", layout: "standing", capacity: 320, sold: 280, prices: [2500, 3000, 3500], onSaleDaysBefore: 90 },
];

// Mulberry32: a tiny seeded generator, so the numbers never change.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function splitTiers(plan: Plan): Tier[] {
  const early = Math.round(plan.capacity * 0.25);
  const door = Math.round(plan.capacity * 0.15);
  const standard = plan.capacity - early - door;
  const caps = [early, standard, door];
  let left = plan.sold;
  return ["Early bird", "Standard", "On the door"].map((name, i) => {
    const sold = Math.min(caps[i], left);
    left -= sold;
    return {
      id: `${plan.id}-t${i + 1}`,
      name,
      pricePence: plan.prices[i],
      capacity: caps[i],
      sold,
    };
  });
}

// Spread the tickets sold so far across the days since tickets went on sale:
// a burst on the first days, a long middle, and a rise in the last fortnight.
function spreadSales(plan: Plan, random: () => number): Show["dailySales"] {
  const onSale = addDays(plan.date, -plan.onSaleDaysBefore);
  const lastDay = plan.date < TODAY ? plan.date : addDays(TODAY, -1);
  const days = Math.max(1, daysBetween(onSale, lastDay) + 1);
  const weights = Array.from({ length: days }, (_, i) => {
    const toShow = daysBetween(addDays(onSale, i), plan.date);
    const launch = i < 3 ? 6 - i * 1.5 : 0;
    const finalRun = toShow < 14 ? (14 - toShow) * 0.25 : 0;
    return 0.6 + launch + finalRun + random() * 0.8;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.floor((w / total) * plan.sold));
  let rest = plan.sold - counts.reduce((a, b) => a + b, 0);
  for (let i = counts.length - 1; rest > 0; i = (i - 1 + counts.length) % counts.length) {
    counts[i]++;
    rest--;
  }
  return counts.map((tickets, i) => ({ date: addDays(onSale, i), tickets }));
}

export function seed(): { venue: Venue; shows: Show[] } {
  const random = rng(1107);
  const shows = PLANS.map((plan): Show => ({
    id: plan.id,
    title: plan.title,
    support: plan.support,
    date: plan.date,
    doors: plan.layout === "seated" ? "19:00" : "19:30",
    onSaleDate: addDays(plan.date, -plan.onSaleDaysBefore),
    layout: plan.layout,
    status: plan.sold >= plan.capacity ? "sold_out" : "on_sale",
    tiers: splitTiers(plan),
    dailySales: spreadSales(plan, random),
  }));
  return {
    venue: { id: "kestrel-rooms", name: "The Kestrel Rooms", city: "Leeds", capacity: 320 },
    shows,
  };
}
