// What Ask tells Claude about the venue: today's date and the list of
// upcoming shows, so it can pick shows and months. No figures: the
// components fetch those from Doorlist when they're drawn.
import { db } from "../db.ts";
import { TODAY } from "../clock.ts";
import { upcomingShows } from "../shows.ts";

export function askContext() {
  return {
    today: TODAY,
    venue: db.venue.name,
    shows: upcomingShows().map((s) => ({ id: s.id, title: s.title, date: s.date, layout: s.layout, status: s.status })),
  };
}
