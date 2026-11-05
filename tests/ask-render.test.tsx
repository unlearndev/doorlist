// @vitest-environment jsdom
// Draws answers with the real registry, with Doorlist's API stubbed out, to
// check what someone using the Ask panel would see.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { JSONUIProvider, Renderer, type Spec } from "@json-render/react";
import { handlers, registry } from "../src/ask/registry";

function answer(elements: Spec["elements"]): Spec {
  return { root: "a", elements: { a: { type: "Section", props: {}, children: Object.keys(elements) }, ...elements } };
}

function draw(spec: Spec) {
  return render(
    <JSONUIProvider registry={registry} handlers={handlers(() => undefined, () => ({}))}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>,
  );
}

function stubApi(routes: Record<string, unknown>) {
  vi.stubGlobal("fetch", async (url: string) => {
    const path = Object.keys(routes).find((p) => url.startsWith(p));
    return path ? new Response(JSON.stringify(routes[path])) : new Response("{}", { status: 404 });
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("drawing an answer", () => {
  it("shows an empty state when a table has no shows to list", async () => {
    stubApi({ "/api/shows": [] });
    draw(answer({ t: { type: "ShowTable", props: { month: "2027-01" }, children: [] } }));
    expect(await screen.findByText("No shows match.")).toBeTruthy();
  });

  it("shows Doorlist's figure, formatted, rather than anything in the answer", async () => {
    stubApi({ "/api/figures": { value: 62400, format: "pounds" } });
    draw(answer({ s: { type: "StatCard", props: { label: "Revenue", metric: "revenue", showId: "kr-1203" }, children: [] } }));
    expect(await screen.findByText("£624")).toBeTruthy();
  });

  it("says when it couldn't load a show", async () => {
    stubApi({});
    draw(answer({ c: { type: "SalesChart", props: { showId: "kr-9999" }, children: [] } }));
    expect(await screen.findByText("Doorlist doesn't have that show.")).toBeTruthy();
  });

  it("puts a note in place of a part that fails to draw, and keeps the rest", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubApi({});
    draw(
      answer({
        f: { type: "Filter", props: { label: "Price", field: "price", value: { $bindState: "/filters/price" } }, children: [] },
        n: { type: "Callout", props: { tone: "info", title: "Still here" }, children: [] },
      }),
    );
    expect(await screen.findByText("This part of the answer couldn't be shown.")).toBeTruthy();
    expect(screen.getByText("Still here")).toBeTruthy();
  });
});
