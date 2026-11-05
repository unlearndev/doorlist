// Each catalog entry, drawn with the component Doorlist already uses. The
// figures come from Doorlist's API (useLive), never from the answer itself.
// Every part has an empty state, a "couldn't load" state, and a fallback if
// it fails to draw, so one bad part never takes the rest of the answer down.
import { Component, type ComponentType, type ReactNode } from "react";
import { defineRegistry, useBoundProp } from "@json-render/react";
import { catalog } from "./catalog";
import { query, useLive } from "./useLive";
import { actions } from "./actions";
import { Section } from "../components/Section";
import { StatCard } from "../components/StatCard";
import { ShowTable, type ShowRow } from "../components/ShowTable";
import { SalesChart } from "../components/SalesChart";
import { TierBreakdown } from "../components/TierBreakdown";
import { Callout } from "../components/Callout";
import { Placeholder } from "../components/Placeholder";
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

// If a part throws while it's drawn, show a short note in its place, rather
// than nothing at all.
class PartBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("Ask: part of an answer failed to draw", error);
  }
  render() {
    return this.state.failed ? <div className="part-note">This part of the answer couldn't be shown.</div> : this.props.children;
  }
}

function part<P extends object>(Render: ComponentType<P>) {
  return (props: P) => (
    <PartBoundary>
      <Render {...props} />
    </PartBoundary>
  );
}

function Unavailable({ children }: { children: ReactNode }) {
  return <div className="part-note">{children}</div>;
}

function couldntLoad(failed: number | null) {
  return failed === 404 ? "Doorlist doesn't have that show." : "Couldn't load this from Doorlist. It'll try again in a moment.";
}

export const { registry, handlers } = defineRegistry(catalog, {
  actions,
  components: {
    Section: ({ props, children }) => <Section title={props.title}>{children}</Section>,
    StatCard: part(({ props }) => {
      const { data, failed } = useLive<Figure>(`/api/figures?${query({ metric: props.metric, month: props.month, showId: props.showId })}`);
      const value = data ? formatFigure(data) : failed !== null ? "Not available" : <Placeholder width={72} />;
      return <StatCard label={props.label} value={value} hint={props.hint} />;
    }),
    ShowTable: part(({ props }) => {
      // pace and layout arrive already resolved when they follow a filter.
      const pace = props.pace as string | null | undefined;
      const layout = props.layout as string | null | undefined;
      const { data: rows, failed } = useLive<ShowRow[]>(`/api/shows?${query({ month: props.month, pace, layout, ids: props.showIds, sort: props.sort, limit: props.limit })}`);
      return (
        <div className="card">
          {rows && rows.length === 0 && <p className="muted">No shows match.</p>}
          {rows && rows.length > 0 && <ShowTable rows={rows} onOpen={(id) => (location.hash = `/shows/${id}`)} />}
          {!rows && failed !== null && <p className="muted">{couldntLoad(failed)}</p>}
          {!rows && failed === null && <Placeholder height={120} />}
        </div>
      );
    }),
    SalesChart: part(({ props }) => {
      const { data, failed } = useLive<{ show: Show }>(`/api/shows/${props.showId}`);
      if (!data && failed !== null) return <Unavailable>{couldntLoad(failed)}</Unavailable>;
      return (
        <div className="card">
          <h2>{data ? `${data.show.title}: tickets sold per day` : "Tickets sold per day"}</h2>
          {data ? <SalesChart days={data.show.dailySales} /> : <Placeholder height={140} />}
        </div>
      );
    }),
    TierBreakdown: part(({ props }) => {
      const { data, failed } = useLive<{ show: Show }>(`/api/shows/${props.showId}`);
      if (!data && failed !== null) return <Unavailable>{couldntLoad(failed)}</Unavailable>;
      return (
        <div className="card">
          {data && <h2>{data.show.title}: tickets</h2>}
          {data ? <TierBreakdown tiers={data.show.tiers} /> : <Placeholder height={100} />}
        </div>
      );
    }),
    Callout: part(({ props }) => <Callout tone={props.tone} title={props.title} text={props.text} />),
    Filter: part(({ props, bindings }) => {
      const [value, setValue] = useBoundProp<string>(props.value as unknown as string, bindings?.value);
      return (
        <Field label={props.label}>
          <Select value={value ?? ""} options={FILTER_OPTIONS[props.field]} onChange={setValue} />
        </Field>
      );
    }),
    ShowPicker: part(({ props, bindings }) => {
      const [value, setValue] = useBoundProp<string>(props.value as unknown as string, bindings?.value);
      const shows = useLive<ShowStats[]>("/api/shows", 60000).data ?? [];
      const options = [{ value: "", label: "Choose a show" }, ...shows.map((s) => ({ value: s.id, label: s.title }))];
      return (
        <Field label={props.label}>
          <Select value={value ?? ""} options={options} onChange={setValue} />
        </Field>
      );
    }),
    Button: part(({ props, emit }) => (
      <div className="answer-button">
        <button className={`button${props.variant === "secondary" ? " secondary" : ""}`} onClick={() => emit("press")}>
          {props.label}
        </button>
      </div>
    )),
    NumberField: part(({ props, bindings }) => {
      const [value, setValue] = useBoundProp<number>(props.value as unknown as number, bindings?.value);
      return (
        <Field label={props.label}>
          <span className="number-field">
            <input type="number" value={value ?? ""} onChange={(e) => setValue(Number(e.target.value))} />
            {props.suffix && <span>{props.suffix}</span>}
          </span>
        </Field>
      );
    }),
  },
});
