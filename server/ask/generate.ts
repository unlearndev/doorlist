// Ask, answering with Doorlist's own components. Claude gets the catalog as
// its instructions (catalog.prompt()) and writes back a spec: which
// components to show, in what order, and what each one should fetch. It
// arrives as JSON patches, one per line, which we put together here.
//
// Claude only sees the list of shows, never a figure. Anything it writes to
// /state is dropped, and so is any element that doesn't fit its catalog
// entry, so every number on screen comes from Doorlist's API.
import Anthropic from "@anthropic-ai/sdk";
import { buildUserPrompt, compileSpecStream, type Spec } from "@json-render/core";
import { catalog, layout, pace } from "../../src/ask/catalog.ts";
import { askContext } from "./context.ts";

const client = new Anthropic();
export const MODEL = process.env.DOORLIST_MODEL ?? "claude-opus-5-5";

export const SYSTEM = catalog.prompt({
  customRules: [
    "You answer questions from the staff of a music venue about their upcoming shows and ticket sales.",
    "Doorlist fills in every figure itself: choose components and point them at a metric, a month or a show id. Never write figures or sample data. The only state you may set is the starting value of filters (/state/filters) and form fields (/state/form).",
    "Text you write (labels, headings, callouts) is words only, with no numbers or dates. You haven't seen any figures, so never claim how a show is selling: that's what the components are for. If a question needs a figure no component can show, say so in a Callout.",
  ],
});

// Claude may set the root, add elements, and give filters and form fields
// their starting values. Nothing else, so no figures in /state.
export function keepLine(patch: { op?: string; path?: string; value?: unknown }) {
  const path = patch.path ?? "";
  if (path === "/root" || /^\/elements\/[^/]+$/.test(path)) return true;
  if (/^\/state\/filters(\/[a-zA-Z]+)?$/.test(path)) return filterValues(patch.value);
  if (/^\/state\/form(\/[a-zA-Z]+)?$/.test(path)) return startingValues(patch.value);
  return false;
}

// A filter starts on one of Doorlist's own options, or "" for All.
const FILTER_VALUES: unknown[] = ["", ...pace.options, ...layout.options];

function filterValues(value: unknown): boolean {
  if (value && typeof value === "object" && !Array.isArray(value)) return Object.values(value).every((v) => FILTER_VALUES.includes(v));
  return FILTER_VALUES.includes(value);
}

// A starting value is a string, a whole number, or an object of those.
function startingValues(value: unknown): boolean {
  if (typeof value === "string" || Number.isInteger(value)) return true;
  if (value && typeof value === "object" && !Array.isArray(value)) return Object.values(value).every((v) => typeof v === "string" || Number.isInteger(v));
  return false;
}

// Each element must be a component from the catalog, with props that fit
// its entry. Anything else is left out of the answer.
export function checkSpec(spec: Spec): { spec: Spec; dropped: string[] } {
  const components = catalog.data.components as Record<string, { props: { safeParse: (p: unknown) => { success: boolean } } }>;
  const elements: Spec["elements"] = {};
  const dropped: string[] = [];
  for (const [key, element] of Object.entries(spec.elements ?? {})) {
    const entry = components[element.type];
    if (entry && entry.props.safeParse(element.props ?? {}).success) elements[key] = element;
    else dropped.push(`${key} (${element.type})`);
  }
  return { spec: { root: spec.root, elements, state: spec.state }, dropped };
}

export async function generateAnswer(question: string): Promise<Spec | null> {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: buildUserPrompt({ prompt: `Venue and shows:\n${JSON.stringify(askContext())}\n\nQuestion: ${question}` }),
      },
    ],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") return null;
  const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  const lines = text.split("\n").filter((line) => {
    try {
      return keepLine(JSON.parse(line));
    } catch {
      return false;
    }
  });
  const { spec, dropped } = checkSpec(compileSpecStream(lines.join("\n")) as unknown as Spec);
  if (dropped.length) console.warn("Ask left out:", dropped.join(", "));
  return spec;
}
