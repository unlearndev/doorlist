// Ask, answering with Doorlist's own components. Claude gets the catalog as
// its instructions (catalog.prompt()) and writes back a spec: which
// components to show, in what order, and what each one should fetch. It
// streams as JSON patches, one per line, and each line goes on to the panel
// as soon as it's checked, so the answer builds up while Claude writes it.
//
// A follow-up question sends the answer that's on screen, and Claude
// replies with patches that change it, rather than a whole new answer.
//
// Claude only sees the list of shows, never a figure. Every patch is
// applied to a copy of the answer so far and kept only if what it touched
// still fits the catalog, so every number on screen comes from Doorlist's
// API, and every button runs one of Doorlist's own actions.
import Anthropic from "@anthropic-ai/sdk";
import { applySpecPatch, buildUserPrompt, type Spec } from "@json-render/core";
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

type Patch = { op?: string; path?: string; value?: unknown };
type Element = Spec["elements"][string] & { watch?: unknown };

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

// A button may only run Doorlist's own actions, with params that are
// values or point at a form field. Anything else a binding could carry
// (json-render's built-in setState, a confirm message Claude wrote, a
// navigate on success) means the element is left out.
const ACTIONS = Object.keys(catalog.data.actions);

function onlyOurActions(element: Element): boolean {
  if (element.watch) return false;
  const bindings = Object.values(element.on ?? {}).flat() as unknown as Record<string, unknown>[];
  return bindings.every((binding) => {
    if (!binding || typeof binding !== "object") return false;
    if (Object.keys(binding).some((key) => key !== "action" && key !== "params")) return false;
    if (!ACTIONS.includes(String(binding.action))) return false;
    const params = (binding.params ?? {}) as Record<string, unknown>;
    return Object.values(params).every(
      (v) => typeof v === "string" || typeof v === "number" || (typeof v === "object" && v !== null && /^\/form\/[a-zA-Z]+$/.test(String((v as { $state?: unknown }).$state))),
    );
  });
}

// An element fits when it's a component from the catalog, its props fit
// that component's entry, and its buttons only run our actions.
export function elementFits(element: Element | undefined): boolean {
  if (!element) return false;
  const components = catalog.data.components as Record<string, { props: { safeParse: (p: unknown) => { success: boolean } } }>;
  const entry = components[element.type];
  return Boolean(entry && entry.props.safeParse(element.props ?? {}).success && onlyOurActions(element));
}

// Applies one patch to a copy of the answer, and returns the new answer, or
// null if the patch isn't allowed or leaves an element that doesn't fit.
export function applyChecked(spec: Spec, patch: Patch): Spec | null {
  const path = patch.path ?? "";
  if (!["add", "replace", "remove"].includes(patch.op ?? "")) return null;
  const apply = () => applySpecPatch(structuredClone(spec), patch as Parameters<typeof applySpecPatch>[1]);
  if (path === "/root") return patch.op !== "remove" && typeof patch.value === "string" ? apply() : null;
  if (/^\/state\/filters(\/[a-zA-Z]+)?$/.test(path)) return patch.op === "remove" || filterValues(patch.value) ? apply() : null;
  if (/^\/state\/form(\/[a-zA-Z]+)?$/.test(path)) return patch.op === "remove" || startingValues(patch.value) ? apply() : null;
  const key = /^\/elements\/([^/]+)/.exec(path)?.[1];
  if (!key) return null;
  const next = apply();
  if (patch.op === "remove" && path === `/elements/${key}`) return next;
  return elementFits(next.elements[key] as Element) ? next : null;
}

// Keeps only the elements that fit, for an answer the panel sends back
// with a follow-up question.
export function checkSpec(spec: Spec | null | undefined): Spec {
  const elements: Spec["elements"] = {};
  for (const [key, element] of Object.entries(spec?.elements ?? {})) if (elementFits(element as Element)) elements[key] = element;
  return { root: spec?.root ?? "", elements, state: spec?.state };
}

export async function* answerStream(question: string, onScreen?: Spec | null): AsyncGenerator<string> {
  const current = onScreen?.root ? checkSpec(onScreen) : null;
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
        content: buildUserPrompt({
          prompt: `Venue and shows:\n${JSON.stringify(askContext())}\n\nQuestion: ${question}`,
          currentSpec: current,
          editModes: ["patch"],
        }),
      },
    ],
  });

  let spec: Spec = current ?? { root: "", elements: {} };
  let buffer = "";
  const check = (line: string) => {
    if (!line.trim()) return null;
    try {
      const next = applyChecked(spec, JSON.parse(line));
      if (next) {
        spec = next;
        return `${line.trim()}\n`;
      }
    } catch {
      // Not a whole JSON line, so there's nothing to keep.
    }
    console.warn("Ask left out:", line.slice(0, 160));
    return null;
  };

  for await (const event of stream) {
    if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;
    buffer += event.delta.text;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const kept = check(line);
      if (kept) yield kept;
    }
  }
  const last = check(buffer);
  if (last) yield last;

  const { usage } = await stream.finalMessage();
  const promptTokens = usage.input_tokens + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
  console.log(`Ask: "${question}" (${promptTokens} tokens in, ${usage.output_tokens} out)`);
  yield `${JSON.stringify({ __meta: "usage", promptTokens, completionTokens: usage.output_tokens, totalTokens: promptTokens + usage.output_tokens })}\n`;
}
