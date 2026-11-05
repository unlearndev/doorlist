// Plays each hand-written answer in tests/fixtures through the same checks
// a real answer goes through, and checks what's kept and what's left out.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { applySpecPatch, type Spec } from "@json-render/core";
import { checkedLines } from "../server/ask/generate.ts";

async function* text(content: string) {
  yield content;
}

// Plays an answer through the checks, and applies the lines that are kept
// to the answer on screen, the way the Ask panel does.
async function play(content: string, onScreen: Spec | null = null) {
  let spec: Spec = structuredClone(onScreen ?? { root: "", elements: {} });
  for await (const line of checkedLines(text(content), onScreen)) spec = applySpecPatch(spec, JSON.parse(line));
  const leftOut = (spec.state?.doorlist as { leftOut: number }).leftOut;
  return { spec, leftOut };
}

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}.jsonl`, import.meta.url), "utf8");

describe("Ask's checks on an answer", () => {
  it("keeps the parts of a broken answer that fit, and counts the rest", async () => {
    const { spec, leftOut } = await play(fixture("broken"));
    expect(Object.keys(spec.elements).sort()).toEqual(["answer", "sold", "table"]);
    expect(leftOut).toBe(3); // the PieChart, the "profit" figure and the cut-off line
  });

  it("keeps nothing from an answer written as prose", async () => {
    const { spec, leftOut } = await play(fixture("prose"));
    expect(spec.root ?? "").toBe("");
    expect(leftOut).toBe(2);
  });

  it("leaves out a button for an action Doorlist doesn't have", async () => {
    const { spec } = await play(fixture("night-ferries"));
    expect(spec.elements.refund).toBeUndefined();
    expect(spec.elements.discount?.type).toBe("Button");
  });

  it("leaves out json-render's built-in setState, and a confirm message Claude wrote", async () => {
    const answer = [
      { op: "add", path: "/root", value: "a" },
      { op: "add", path: "/elements/a", value: { type: "Section", props: {}, children: ["b", "c"] } },
      { op: "add", path: "/elements/b", value: { type: "Button", props: { label: "Reset" }, on: { press: { action: "setState", params: { statePath: "/form/percent", value: 90 } } } } },
      {
        op: "add",
        path: "/elements/c",
        value: { type: "Button", props: { label: "Create" }, on: { press: { action: "create_discount", params: { showId: "kr-1203", percent: 20 }, confirm: { title: "Safe", message: "Nothing will change" } } } },
      },
    ];
    const { spec, leftOut } = await play(answer.map((l) => JSON.stringify(l)).join("\n"));
    expect(Object.keys(spec.elements)).toEqual(["a"]);
    expect(leftOut).toBe(2);
  });

  it("never lets Claude write figures: no digits in text, no state outside filters and forms", async () => {
    const answer = [
      { op: "add", path: "/root", value: "a" },
      { op: "add", path: "/elements/a", value: { type: "Callout", props: { tone: "info", title: "We sold 52 tickets" } } },
      { op: "add", path: "/state/figures", value: { sold: 52 } },
      { op: "add", path: "/state/doorlist", value: { leftOut: 0 } },
    ];
    const { spec, leftOut } = await play(answer.map((l) => JSON.stringify(l)).join("\n"));
    expect(spec.elements.a).toBeUndefined();
    expect(spec.state?.figures).toBeUndefined();
    expect(leftOut).toBe(3);
  });

  it("only starts a filter on one of Doorlist's own options", async () => {
    const answer = [
      { op: "add", path: "/state/filters", value: { pace: "all" } },
      { op: "add", path: "/state/filters/layout", value: "seated" },
    ];
    const { spec, leftOut } = await play(answer.map((l) => JSON.stringify(l)).join("\n"));
    expect(spec.state?.filters).toEqual({ layout: "seated" });
    expect(leftOut).toBe(1);
  });

  it("checks a follow-up's changes against the answer on screen", async () => {
    const { spec: onScreen } = await play(fixture("january"));
    const followUp = [
      { op: "replace", path: "/elements/sold/props/metric", value: "profit" },
      { op: "replace", path: "/elements/sold/props/label", value: "Tickets sold in December" },
    ];
    const { spec, leftOut } = await play(followUp.map((l) => JSON.stringify(l)).join("\n"), onScreen);
    expect(spec.elements.sold.props).toMatchObject({ metric: "ticketsSold", label: "Tickets sold in December" });
    expect(leftOut).toBe(1);
  });
});
