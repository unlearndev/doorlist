// Doorlist's API, mounted on Vite's dev server (see vite.config.ts), so one
// `npm run dev` serves the whole app. Every route but sign-in needs a
// signed-in member of staff.
import type { IncomingMessage, ServerResponse } from "node:http";
import { db } from "./db.ts";
import { findShow, statsFor, upcomingShows, venueTotals } from "./shows.ts";
import { sellOnTheDoor, SaleError } from "./sales.ts";
import { createDiscountCode, DiscountError } from "./discounts.ts";
import { AuthError, ForbiddenError, clearedCookie, currentStaff, sessionCookie, signIn, signOut } from "./auth.ts";
import { generateAnswer } from "./ask/generate.ts";

type Next = (err?: unknown) => void;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(data));
}

const userErrors = [SaleError, DiscountError];

export async function api(req: IncomingMessage, res: ServerResponse, next: Next) {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/")) return next();
  const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]
  try {
    if (req.method === "POST" && url.pathname === "/api/sign-in") {
      const { email, password } = JSON.parse(await readBody(req));
      const { token, staff } = signIn(String(email ?? ""), String(password ?? ""));
      res.setHeader("set-cookie", sessionCookie(token));
      return json(res, 200, staff);
    }

    const staff = currentStaff(req);
    if (!staff) return json(res, 401, { error: "Sign in first." });

    if (req.method === "GET" && url.pathname === "/api/me") return json(res, 200, staff);
    if (req.method === "POST" && url.pathname === "/api/sign-out") {
      signOut(req);
      res.setHeader("set-cookie", clearedCookie);
      return json(res, 200, { ok: true });
    }
    if (req.method === "GET" && url.pathname === "/api/venue") {
      return json(res, 200, { venue: db.venue, totals: venueTotals() });
    }
    if (req.method === "GET" && url.pathname === "/api/shows") {
      return json(res, 200, upcomingShows().map(statsFor));
    }
    if (req.method === "GET" && parts[1] === "shows" && parts.length === 3) {
      const show = findShow(parts[2]);
      if (!show) return json(res, 404, { error: "Not found" });
      return json(res, 200, { show, stats: statsFor(show), discounts: db.discounts.filter((d) => d.showId === show.id) });
    }
    if (req.method === "POST" && parts[1] === "shows" && parts[3] === "sales") {
      const { tierId, quantity } = JSON.parse(await readBody(req));
      return json(res, 201, sellOnTheDoor(staff, { showId: parts[2], tierId: String(tierId), quantity: Number(quantity) }));
    }
    if (req.method === "POST" && parts[1] === "shows" && parts[3] === "discounts") {
      const { percent } = JSON.parse(await readBody(req));
      return json(res, 201, createDiscountCode(staff, { showId: parts[2], percent: Number(percent) }));
    }
    if (req.method === "POST" && url.pathname === "/api/ask") {
      const { question } = JSON.parse(await readBody(req));
      const spec = await generateAnswer(String(question));
      if (!spec) return json(res, 200, { spec: null, message: "Sorry, I can't answer that one." });
      return json(res, 200, { spec });
    }
    return json(res, 404, { error: "Not found" });
  } catch (err) {
    if (err instanceof AuthError) return json(res, 401, { error: err.message });
    if (err instanceof ForbiddenError) return json(res, 403, { error: err.message });
    if (userErrors.some((E) => err instanceof E)) return json(res, 400, { error: (err as Error).message });
    console.error(err);
    if (!res.headersSent) return json(res, 500, { error: "Something went wrong" });
    res.end();
  }
}
