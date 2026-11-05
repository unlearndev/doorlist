// Ask, answering with Doorlist's own components. Claude gets the catalog as
// its instructions (catalog.prompt()) and writes back a spec: which
// components to show, in what order, with what props. It arrives as JSON
// patches, one per line, which we put together into the finished spec.
import Anthropic from "@anthropic-ai/sdk";
import { buildUserPrompt, compileSpecStream, type Spec } from "@json-render/core";
import { catalog } from "../../src/ask/catalog.ts";
import { askContext } from "./context.ts";

const client = new Anthropic();
export const MODEL = process.env.DOORLIST_MODEL ?? "claude-opus-5-5";

export const SYSTEM = catalog.prompt({
  customRules: [
    "You answer questions from the staff of a music venue about their upcoming shows and ticket sales.",
    "Use only the venue data you're given with the question. Money is in pence: show it in pounds.",
  ],
});

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
        content: buildUserPrompt({ prompt: `Venue data:\n${JSON.stringify(askContext())}\n\nQuestion: ${question}` }),
      },
    ],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") return null;
  const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
  return compileSpecStream(text) as unknown as Spec;
}
