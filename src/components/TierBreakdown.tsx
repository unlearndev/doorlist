import { pounds } from "../format";

type TierRow = { id: string; name: string; pricePence: number; capacity: number; sold: number };

export function TierBreakdown({ tiers }: { tiers: TierRow[] }) {
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
