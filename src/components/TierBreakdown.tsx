import type { Tier } from "../types";
import { pounds } from "../format";

export function TierBreakdown({ tiers }: { tiers: Tier[] }) {
  return (
    <table>
      <thead>
        <tr><th>Ticket</th><th>Price</th><th>Sold</th><th>Left</th></tr>
      </thead>
      <tbody>
        {tiers.map((t) => (
          <tr key={t.id}>
            <td>{t.name}</td>
            <td>{pounds(t.pricePence)}</td>
            <td>{t.sold}/{t.capacity}</td>
            <td>{t.capacity - t.sold}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
