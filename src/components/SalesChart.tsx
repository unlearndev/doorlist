// Tickets sold per day, as bars.
import { showDate } from "../format";

export function SalesChart({ days }: { days: { date: string; tickets: number }[] }) {
  const recent = days.slice(-28);
  const max = Math.max(1, ...recent.map((d) => d.tickets));
  const width = 560;
  const height = 140;
  const barWidth = width / Math.max(recent.length, 1);
  return (
    <figure className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Tickets sold per day">
        {recent.map((d, i) => {
          const h = (d.tickets / max) * (height - 6);
          return <rect key={d.date} x={i * barWidth + 2} y={height - h} width={barWidth - 4} height={h} rx={2} />;
        })}
      </svg>
      {recent.length > 1 && (
        <figcaption className="chart-axis">
          <span>{showDate(recent[0].date)}</span>
          <span>{showDate(recent[recent.length - 1].date)}</span>
        </figcaption>
      )}
    </figure>
  );
}
