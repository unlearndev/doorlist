// Selling tickets on the door: staff take payment in person, so a sale is
// recorded straight away, against today's figures.
import { db, nextId, type Staff } from "./db.ts";
import { TODAY } from "./clock.ts";
import { findShow } from "./shows.ts";

export class SaleError extends Error {}

export function sellOnTheDoor(staff: Staff, input: { showId: string; tierId: string; quantity: number }) {
  const show = findShow(input.showId);
  if (!show || show.status !== "on_sale") throw new SaleError("This show isn't on sale.");
  const tier = show.tiers.find((t) => t.id === input.tierId);
  if (!tier) throw new SaleError("Unknown ticket type.");
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 10) {
    throw new SaleError("You can sell between 1 and 10 tickets at a time.");
  }
  const left = tier.capacity - tier.sold;
  if (input.quantity > left) throw new SaleError(`Only ${left} left at this price.`);

  tier.sold += input.quantity;
  const today = show.dailySales.find((d) => d.date === TODAY);
  if (today) today.tickets += input.quantity;
  else show.dailySales.push({ date: TODAY, tickets: input.quantity });
  if (show.tiers.every((t) => t.sold >= t.capacity)) show.status = "sold_out";

  const sale = {
    id: nextId("sale"),
    showId: show.id,
    tierId: tier.id,
    quantity: input.quantity,
    amountPence: tier.pricePence * input.quantity,
    soldBy: staff.id,
    soldAt: new Date().toISOString(),
  };
  db.sales.push(sale);
  return sale;
}
