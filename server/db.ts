// Doorlist keeps everything in memory, loaded from the seed when the server
// starts. Restarting the dev server resets it.
import { seed, type Show, type Venue } from "./data/seed.ts";

export type Role = "box_office" | "manager";

export type Staff = { id: string; name: string; email: string; role: Role };

export type DoorSale = { id: string; showId: string; tierId: string; quantity: number; amountPence: number; soldBy: string; soldAt: string };

export type DiscountCode = { code: string; showId: string; percent: number; createdBy: string; createdAt: string };

export type Db = {
  venue: Venue;
  shows: Show[];
  staff: Staff[];
  sales: DoorSale[];
  discounts: DiscountCode[];
};

// The venue's staff. Every demo account's password is "doorlist".
const STAFF: Staff[] = [
  { id: "st-maya", name: "Maya Okafor", email: "maya@kestrelrooms.test", role: "manager" },
  { id: "st-dan", name: "Dan Reilly", email: "dan@kestrelrooms.test", role: "box_office" },
];

function fresh(): Db {
  const { venue, shows } = seed();
  return { venue, shows, staff: STAFF.map((s) => ({ ...s })), sales: [], discounts: [] };
}

export const db: Db = fresh();

export function resetDb() {
  Object.assign(db, fresh());
}

let counter = 1000;
export function nextId(prefix: string) {
  counter += 1;
  return `${prefix}_${counter}`;
}
