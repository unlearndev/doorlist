import { useEffect, useState } from "react";
import type { ShowStats } from "../types";
import { StatCard } from "../components/StatCard";
import { ShowTable } from "../components/ShowTable";
import { pounds, percent } from "../format";

type Totals = {
  upcomingShows: number;
  ticketsSoldLastSevenDays: number;
  thisMonth: { sold: number; capacity: number; revenuePence: number };
  nextMonth: { sold: number; capacity: number; revenuePence: number };
  showsBehind: number;
};

export function Dashboard({ onOpen }: { onOpen: (id: string) => void }) {
  const [shows, setShows] = useState<ShowStats[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  useEffect(() => {
    fetch("/api/shows").then((r) => r.json()).then(setShows);
    fetch("/api/venue").then((r) => r.json()).then((v) => setTotals(v.totals));
  }, []);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Upcoming shows</h1>
          <p>Ticket sales for the next two months</p>
        </div>
      </div>
      {totals && (
        <div className="stats">
          <StatCard label="Sold in the last 7 days" value={String(totals.ticketsSoldLastSevenDays)} />
          <StatCard label="November" value={pounds(totals.thisMonth.revenuePence)} hint={`${percent(totals.thisMonth.sold / totals.thisMonth.capacity)} of tickets sold`} />
          <StatCard label="December" value={pounds(totals.nextMonth.revenuePence)} hint={`${percent(totals.nextMonth.sold / totals.nextMonth.capacity)} of tickets sold`} />
          <StatCard label="Shows behind" value={String(totals.showsBehind)} hint="Selling slower than usual" />
        </div>
      )}
      <div className="card">
        <ShowTable rows={shows} onOpen={onOpen} />
      </div>
    </>
  );
}
