import type { ShowStats } from "../types";
import { PaceBadge } from "./PaceBadge";
import { showDate, pounds } from "../format";

export function ShowTable({ rows, onOpen }: { rows: ShowStats[]; onOpen?: (id: string) => void }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Show</th>
          <th>Sold</th>
          <th>Last 7 days</th>
          <th>Revenue</th>
          <th>Pace</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className={onOpen ? "clickable" : undefined} onClick={() => onOpen?.(row.id)}>
            <td>{showDate(row.date)}</td>
            <td>{row.title}</td>
            <td>
              <div className="sold-cell">
                <div className="bar"><span style={{ width: `${row.sellThrough * 100}%` }} /></div>
                {row.sold}/{row.capacity}
              </div>
            </td>
            <td>{row.lastSevenDays}</td>
            <td>{pounds(row.revenuePence)}</td>
            <td><PaceBadge pace={row.pace} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
