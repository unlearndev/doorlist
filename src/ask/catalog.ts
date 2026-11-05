// The components Claude can use to answer in the Ask panel, and what each
// one takes. Answers are drawn with Doorlist's own components, so an answer
// can only ever contain what's listed here.
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

const pace = z.enum(["ahead", "on_track", "behind", "sold_out"]);

export const catalog = defineCatalog(schema, {
  components: {
    Section: {
      props: z.object({ title: z.string().nullish() }),
      description: "Groups the parts of an answer under an optional heading. Use one as the root.",
    },
    StatCard: {
      props: z.object({ label: z.string(), value: z.string(), hint: z.string().nullish() }),
      description: "One headline figure, such as tickets sold or revenue, with a short label and an optional hint underneath.",
    },
    ShowTable: {
      props: z.object({
        rows: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            date: z.string(),
            sold: z.number(),
            capacity: z.number(),
            lastSevenDays: z.number(),
            revenuePence: z.number(),
            pace,
          }),
        ),
      }),
      description: "Doorlist's table of shows: date, title, tickets sold against capacity, the last seven days, revenue and pace.",
    },
    TierBreakdown: {
      props: z.object({
        tiers: z.array(z.object({ name: z.string(), pricePence: z.number(), capacity: z.number(), sold: z.number() })),
      }),
      description: "One show's ticket types, with the price, how many have sold and how many are left.",
    },
    Callout: {
      props: z.object({ tone: z.enum(["info", "warning", "bad"]), title: z.string(), text: z.string().nullish() }),
      description: "A short highlighted note: the takeaway, or a warning.",
    },
  },
  actions: {},
});
