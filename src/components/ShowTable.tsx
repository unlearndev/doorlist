import { PaceBadge } from "./PaceBadge";
import { showDate, pounds } from "../format";
import type { Pace } from "../types";

export type ShowRow = {
  id: string;
  title: string;
  date: string;
  sold: number;
  capacity: number;
  sellThrough: number;
  lastSevenDays: number;
  revenuePence: number;
  pace: Pace;
};

export function ShowTable({ rows, onOpen }: { rows: ShowRow[]; onOpen?: (id: string) => void }) {
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
                <div className="bar"><span style={{ width: `${Math.min(1, row.sellThrough) * 100}%` }} /></div>
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
