// Each catalog entry, drawn with the component Doorlist already uses. The
// figures come from Doorlist's API (useLive), never from the answer itself.
import { defineRegistry, useBoundProp } from "@json-render/react";
import { catalog } from "./catalog";
import { query, useLive } from "./useLive";
import { Section } from "../components/Section";
import { StatCard } from "../components/StatCard";
import { ShowTable, type ShowRow } from "../components/ShowTable";
import { SalesChart } from "../components/SalesChart";
import { TierBreakdown } from "../components/TierBreakdown";
import { Callout } from "../components/Callout";
import { Field, Select } from "../components/Fields";
import type { Show, ShowStats } from "../types";
import { percent, pounds } from "../format";

type Figure = { value: number; format: "number" | "pounds" | "percent" };

function formatFigure(f: Figure) {
  if (f.format === "pounds") return pounds(f.value);
  if (f.format === "percent") return percent(f.value);
  return f.value.toLocaleString("en-GB");
}

// Doorlist's own options for each filter. Claude picks the field; it never
// writes the options.
const FILTER_OPTIONS = {
  layout: [{ value: "", label: "All" }, { value: "standing", label: "Standing" }, { value: "seated", label: "Seated" }],
  pace: [
    { value: "", label: "All" },
    { value: "ahead", label: "Ahead" },
    { value: "on_track", label: "On track" },
    { value: "behind", label: "Behind" },
    { value: "sold_out", label: "Sold out" },
  ],
};

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
      // pace and layout arrive already resolved when they follow a filter.
      const pace = props.pace as string | null | undefined;
      const layout = props.layout as string | null | undefined;
      const rows = useLive<ShowRow[]>(`/api/shows?${query({ month: props.month, pace, layout, ids: props.showIds, sort: props.sort, limit: props.limit })}`);
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
    Filter: ({ props, bindings }) => {
      const [value, setValue] = useBoundProp<string>(props.value as unknown as string, bindings?.value);
      return (
        <Field label={props.label}>
          <Select value={value ?? ""} options={FILTER_OPTIONS[props.field]} onChange={setValue} />
        </Field>
      );
    },
    ShowPicker: ({ props, bindings }) => {
      const [value, setValue] = useBoundProp<string>(props.value as unknown as string, bindings?.value);
      const shows = useLive<ShowStats[]>("/api/shows", 60000) ?? [];
      const options = [{ value: "", label: "Choose a show" }, ...shows.map((s) => ({ value: s.id, label: s.title }))];
      return (
        <Field label={props.label}>
          <Select value={value ?? ""} options={options} onChange={setValue} />
        </Field>
      );
    },
    NumberField: ({ props, bindings }) => {
      const [value, setValue] = useBoundProp<number>(props.value as unknown as number, bindings?.value);
      return (
        <Field label={props.label}>
          <span className="number-field">
            <input type="number" value={value ?? ""} onChange={(e) => setValue(Number(e.target.value))} />
            {props.suffix && <span>{props.suffix}</span>}
          </span>
        </Field>
      );
    },
  },
});
