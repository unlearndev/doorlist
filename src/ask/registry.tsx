// Each catalog entry, drawn with the component Doorlist already uses.
import { defineRegistry } from "@json-render/react";
import { catalog } from "./catalog";
import { Section } from "../components/Section";
import { StatCard } from "../components/StatCard";
import { ShowTable } from "../components/ShowTable";
import { TierBreakdown } from "../components/TierBreakdown";
import { Callout } from "../components/Callout";

export const { registry } = defineRegistry(catalog, {
  components: {
    Section: ({ props, children }) => <Section title={props.title}>{children}</Section>,
    StatCard: ({ props }) => <StatCard label={props.label} value={props.value} hint={props.hint} />,
    ShowTable: ({ props }) => (
      <div className="card">
        <ShowTable
          rows={props.rows.map((r) => ({ ...r, sellThrough: r.capacity ? r.sold / r.capacity : 0 }))}
          onOpen={(id) => (location.hash = `/shows/${id}`)}
        />
      </div>
    ),
    TierBreakdown: ({ props }) => (
      <div className="card">
        <TierBreakdown tiers={props.tiers.map((t, i) => ({ ...t, id: String(i) }))} />
      </div>
    ),
    Callout: ({ props }) => <Callout tone={props.tone} title={props.title} text={props.text} />,
  },
});
