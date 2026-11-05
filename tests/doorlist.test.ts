import { beforeEach, describe, expect, it } from "vitest";
import { db, resetDb } from "../server/db.ts";
import { findShow, statsFor, venueTotals } from "../server/shows.ts";
import { sellOnTheDoor, SaleError } from "../server/sales.ts";
import { createDiscountCode, DiscountError } from "../server/discounts.ts";
import { ForbiddenError, signIn, AuthError } from "../server/auth.ts";

const maya = () => db.staff.find((s) => s.role === "manager")!;
const dan = () => db.staff.find((s) => s.role === "box_office")!;

beforeEach(() => resetDb());

describe("figures", () => {
  it("works out a show's figures from its tiers", () => {
    const stats = statsFor(findShow("kr-1203")!);
    expect(stats.sold).toBe(52);
    expect(stats.capacity).toBe(320);
    expect(stats.pace).toBe("behind");
  });

  it("totals next month's shows", () => {
    const { nextMonth } = venueTotals();
    expect(nextMonth.month).toBe("2026-12");
    expect(nextMonth.shows).toBe(8);
  });
});

describe("selling on the door", () => {
  it("adds the tickets to the show's figures straight away", () => {
    sellOnTheDoor(dan(), { showId: "kr-1203", tierId: "kr-1203-t2", quantity: 2 });
    expect(statsFor(findShow("kr-1203")!).sold).toBe(54);
  });

  it("won't sell more than are left", () => {
    expect(() => sellOnTheDoor(dan(), { showId: "kr-1107", tierId: "kr-1107-t2", quantity: 1 })).toThrow(SaleError);
  });
});

describe("discount codes", () => {
  it("lets a manager create one", () => {
    const code = createDiscountCode(maya(), { showId: "kr-1203", percent: 20 });
    expect(code.code).toBe("GLASSH20");
  });

  it("refuses box office staff", () => {
    expect(() => createDiscountCode(dan(), { showId: "kr-1203", percent: 20 })).toThrow(ForbiddenError);
  });

  it("refuses more than 30% off", () => {
    expect(() => createDiscountCode(maya(), { showId: "kr-1203", percent: 60 })).toThrow(DiscountError);
  });
});

describe("signing in", () => {
  it("checks the password", () => {
    expect(() => signIn("dan@kestrelrooms.test", "wrong")).toThrow(AuthError);
    expect(signIn("dan@kestrelrooms.test", "doorlist").staff.role).toBe("box_office");
  });
});
