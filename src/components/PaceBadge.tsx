import type { Pace } from "../types";

const LABELS: Record<Pace, string> = { ahead: "Ahead", on_track: "On track", behind: "Behind", sold_out: "Sold out" };

export function PaceBadge({ pace }: { pace: Pace }) {
  return <span className={`badge ${pace}`}>{LABELS[pace]}</span>;
}
