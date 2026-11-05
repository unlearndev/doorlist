// What the Ask panel knows: the venue, every upcoming show with its figures
// worked out by Doorlist, and the venue's totals.
import { db } from "../db.ts";
import { TODAY } from "../clock.ts";
import { statsFor, upcomingShows, venueTotals } from "../shows.ts";

export function askContext() {
  return {
    today: TODAY,
    venue: db.venue,
    totals: venueTotals(),
    shows: upcomingShows().map((show) => ({
      ...statsFor(show),
      support: show.support,
      layout: show.layout,
      tiers: show.tiers.map((t) => ({ name: t.name, pricePence: t.pricePence, capacity: t.capacity, sold: t.sold })),
    })),
  };
}
