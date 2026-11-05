// Selling tickets on the door, from a show's page.
import { useState } from "react";
import type { Tier } from "../types";
import { pounds } from "../format";

export function DoorSale({ showId, tiers, onSold }: { showId: string; tiers: Tier[]; onSold: () => void }) {
  const open = tiers.filter((t) => t.sold < t.capacity);
  const [tierId, setTierId] = useState(open[0]?.id ?? "");
  const [quantity, setQuantity] = useState(2);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function sell() {
    const res = await fetch(`/api/shows/${showId}/sales`, { method: "POST", body: JSON.stringify({ tierId, quantity }) });
    const body = await res.json();
    if (!res.ok) return setMessage({ ok: false, text: body.error });
    setMessage({ ok: true, text: `Sold ${body.quantity} for ${pounds(body.amountPence)}.` });
    onSold();
  }

  if (open.length === 0) return null;
  return (
    <div className="card">
      <h2>Sell on the door</h2>
      <div className="door-sale">
        <select aria-label="Ticket" value={tierId} onChange={(e) => setTierId(e.target.value)}>
          {open.map((t) => <option key={t.id} value={t.id}>{t.name}, {pounds(t.pricePence)}</option>)}
        </select>
        <input aria-label="Tickets" type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        <button className="button" onClick={sell}>Sell</button>
        {message && <span className={message.ok ? "success" : "error"}>{message.text}</span>}
      </div>
    </div>
  );
}
