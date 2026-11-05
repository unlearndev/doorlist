// The first version of Ask: Claude answers a staff question about the
// venue's shows in plain text, streamed back to the panel.
import Anthropic from "@anthropic-ai/sdk";
import { askContext } from "./context.ts";

const client = new Anthropic();
export const MODEL = process.env.DOORLIST_MODEL ?? "claude-opus-5-5";

const SYSTEM = `You answer questions from the staff of a music venue about their upcoming shows and ticket sales.
Use only the data you're given. Money is in pence; show it in pounds. Be brief.`;

export async function* answerInText(question: string) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [
      { role: "user", content: `Venue data:\n${JSON.stringify(askContext())}\n\nQuestion: ${question}` },
    ],
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
  }
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") yield "\n\nSorry, I can't answer that one.";
}
