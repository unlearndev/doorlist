// Each catalog entry, drawn with the component Doorlist already uses. The
// figures come from Doorlist's API (useLive), never from the answer itself.
import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";
import { query, useLive } from "./useLive";
import { Section } from "../components/Section";
import { StatCard } from "../components/StatCard";
import { ShowTable, type ShowRow } from "../components/ShowTable";
import { SalesChart } from "../components/SalesChart";
import { TierBreakdown } from "../components/TierBreakdown";
import { Callout } from "../components/Callout";
import type { Show } from "../types";
import { percent, pounds } from "../format";

type Figure = { value: number; format: "number" | "pounds" | "percent" };

function formatFigure(f: Figure) {
  if (f.format === "pounds") return pounds(f.value);
  if (f.format === "percent") return percent(f.value);
  return f.value.toLocaleString("en-GB");
}

function useShow(id: string) {
  return useLive<{ show: Show }>(`/api/shows/${id}`)?.show ?? null;
}

export const { registry } = defineRegistry(catalog, {
  components: {
    Section: ({ props, children }) => <Section title={props.title}>{children}</Section>,
    StatCard: ({ props }) => {
      const figure = useLive<Figure>(`/api/figures?${query({ metric: props.metric, month: props.month, showId: props.showId })}`);
      return <StatCard label={props.label} value={figure ? formatFigure(figure) : "…"} hint={props.hint} />;
    },
    ShowTable: ({ props }) => {
      const rows = useLive<ShowRow[]>(`/api/shows?${query({ month: props.month, pace: props.pace, layout: props.layout, ids: props.showIds, sort: props.sort, limit: props.limit })}`);
      return (
        <div className="card">
          <ShowTable rows={rows ?? []} onOpen={(id) => (location.hash = `/shows/${id}`)} />
        </div>
      );
    },
    SalesChart: ({ props }) => {
      const show = useShow(props.showId);
      return (
        <div className="card">
          <h2>{show ? `${show.title}: tickets sold per day` : "Tickets sold per day"}</h2>
          <SalesChart days={show?.dailySales ?? []} />
        </div>
      );
    },
    TierBreakdown: ({ props }) => {
      const show = useShow(props.showId);
      return (
        <div className="card">
          {show && <h2>{show.title}: tickets</h2>}
          <TierBreakdown tiers={show?.tiers ?? []} />
        </div>
      );
    },
    Callout: ({ props }) => <Callout tone={props.tone} title={props.title} text={props.text} />,
  },
});
