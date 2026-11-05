// Staff sign-in. A session is a random token in a cookie, kept in memory, so
// restarting the dev server signs everyone out.
import { randomBytes } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { db, type Role, type Staff } from "./db.ts";

const PASSWORD = "doorlist";
const COOKIE = "doorlist_session";
const sessions = new Map<string, string>(); // token -> staff id

export class AuthError extends Error {}
export class ForbiddenError extends Error {}

export function signIn(email: string, password: string): { token: string; staff: Staff } {
  const staff = db.staff.find((s) => s.email === email.trim().toLowerCase());
  if (!staff || password !== PASSWORD) throw new AuthError("That email and password don't match.");
  const token = randomBytes(24).toString("hex");
  sessions.set(token, staff.id);
  return { token, staff };
}

export function signOut(req: IncomingMessage) {
  const token = tokenFrom(req);
  if (token) sessions.delete(token);
}

export function sessionCookie(token: string) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax`;
}

export const clearedCookie = `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

function tokenFrom(req: IncomingMessage): string | null {
  const cookies = req.headers.cookie ?? "";
  const match = cookies.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  return match ? match.slice(COOKIE.length + 1) : null;
}

// The signed-in member of staff, or null.
export function currentStaff(req: IncomingMessage): Staff | null {
  const token = tokenFrom(req);
  const id = token ? sessions.get(token) : undefined;
  return db.staff.find((s) => s.id === id) ?? null;
}

export function requireRole(staff: Staff, role: Role, what: string) {
  if (staff.role !== role) throw new ForbiddenError(`Only managers can ${what}.`);
}
