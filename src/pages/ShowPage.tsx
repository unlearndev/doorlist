import { useEffect, useState } from "react";
import type { Show, ShowStats } from "../types";
import { StatCard } from "../components/StatCard";
import { SalesChart } from "../components/SalesChart";
import { TierBreakdown } from "../components/TierBreakdown";
import { PaceBadge } from "../components/PaceBadge";
import { DiscountDialog } from "../components/DiscountDialog";
import { DoorSale } from "../components/DoorSale";
import { useStaff } from "../session";
import { pounds, percent, showDate } from "../format";

type Data = { show: Show; stats: ShowStats; discounts: { code: string; percent: number }[] };

export function ShowPage({ id }: { id: string }) {
  const staff = useStaff();
  const [data, setData] = useState<Data | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const load = () => fetch(`/api/shows/${id}`).then((r) => r.json()).then(setData);
  useEffect(() => void load(), [id]);
  if (!data) return null;
  const { show, stats } = data;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{show.title}</h1>
          <p>{showDate(show.date)} · doors {show.doors}{show.support ? ` · with ${show.support}` : ""}</p>
        </div>
        <div>
          <PaceBadge pace={stats.pace} />{" "}
          {staff.role === "manager" && (
            <button className="button" onClick={() => setDiscountOpen(true)} disabled={show.status === "sold_out"}>
              Create a discount code
            </button>
          )}
        </div>
      </div>
      <div className="stats">
        <StatCard label="Sold" value={`${stats.sold}/${stats.capacity}`} hint={`${percent(stats.sellThrough)} sold`} />
        <StatCard label="Revenue" value={pounds(stats.revenuePence)} />
        <StatCard label="Last 7 days" value={String(stats.lastSevenDays)} />
        <StatCard label="Days to go" value={String(stats.daysToShow)} />
      </div>
      <DoorSale showId={show.id} tiers={show.tiers} onSold={() => void load()} />
      <div className="card">
        <h2>Tickets sold per day</h2>
        <SalesChart days={show.dailySales} />
      </div>
      <div className="card">
        <h2>Tickets</h2>
        <TierBreakdown tiers={show.tiers} />
      </div>
      {data.discounts.length > 0 && (
        <div className="card">
          <h2>Discount codes</h2>
          {data.discounts.map((d) => <div key={d.code}>{d.code} · {d.percent}% off</div>)}
        </div>
      )}
      {discountOpen && (
        <DiscountDialog showId={show.id} title={show.title} onClose={() => { setDiscountOpen(false); void load(); }} />
      )}
    </>
  );
}
