// Who's signed in. The server decides what they're allowed to do; the app
// only uses this to say who you are and to hide buttons you can't use.
import { createContext, useContext } from "react";

export type Staff = { id: string; name: string; email: string; role: "box_office" | "manager" };

export const SessionContext = createContext<Staff | null>(null);

export function useStaff(): Staff {
  const staff = useContext(SessionContext);
  if (!staff) throw new Error("useStaff needs a signed-in member of staff");
  return staff;
}

export const ROLE_NAMES: Record<Staff["role"], string> = { box_office: "Box office", manager: "Venue manager" };
