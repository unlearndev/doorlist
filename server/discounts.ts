// Discount codes for a show. Only managers can create them, and never for
// more than MAX_DISCOUNT_PERCENT off.
import { db, type Staff } from "./db.ts";
import { findShow } from "./shows.ts";
import { requireRole } from "./auth.ts";

export const MIN_DISCOUNT_PERCENT = 5;
export const MAX_DISCOUNT_PERCENT = 30;

export class DiscountError extends Error {}

export function createDiscountCode(staff: Staff, input: { showId: string; percent: number }) {
  requireRole(staff, "manager", "create discount codes");
  const show = findShow(input.showId);
  if (!show) throw new DiscountError("Unknown show.");
  if (show.status === "sold_out") throw new DiscountError("This show is sold out.");
  if (!Number.isInteger(input.percent) || input.percent < MIN_DISCOUNT_PERCENT || input.percent > MAX_DISCOUNT_PERCENT) {
    throw new DiscountError(`Discounts are between ${MIN_DISCOUNT_PERCENT}% and ${MAX_DISCOUNT_PERCENT}%.`);
  }
  const word = show.title.replace(/[^A-Za-z]/g, "").slice(0, 6).toUpperCase();
  const code = { code: `${word}${input.percent}`, showId: show.id, percent: input.percent, createdBy: staff.id, createdAt: new Date().toISOString() };
  db.discounts.push(code);
  return code;
}
