// The components Claude can use to answer in the Ask panel, and what each
// one takes. Answers are drawn with Doorlist's own components, so an answer
// can only ever contain what's listed here.
//
// Claude never writes a figure. Components take a reference (a metric, a
// month, a show id) and fetch the figures from Doorlist's API, so what's on
// screen is always Doorlist's own, current numbers.
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

// Text Claude writes itself. It can't contain digits, so a figure can't
// reach the screen this way either.
const words = z.string().regex(/^[^0-9]*$/, "Text can't contain figures");
const month = z.string().regex(/^\d{4}-\d{2}$/, "A month is YYYY-MM");
const showId = z.string().regex(/^kr-\d{4}$/, "A show id looks like kr-1203");

export const catalog = defineCatalog(schema, {
  components: {
    Section: {
      props: z.object({ title: words.nullish() }),
      description: "Groups the parts of an answer under an optional heading. Use one as the root.",
    },
    StatCard: {
      props: z.object({
        label: words,
        metric: z.enum(["ticketsSold", "capacity", "sellThrough", "revenue", "lastSevenDays", "showsBehind", "shows"]),
        month: month.nullish(),
        showId: showId.nullish(),
        hint: words.nullish(),
      }),
      description:
        "One headline figure, which Doorlist works out and fills in. Pick the metric, and a month (YYYY-MM) or a showId to narrow it, or neither for every upcoming show. sellThrough is the share of tickets sold; showsBehind counts shows selling slower than usual.",
    },
    ShowTable: {
      props: z.object({
        month: month.nullish(),
        pace: z.enum(["ahead", "on_track", "behind", "sold_out"]).nullish(),
        layout: z.enum(["standing", "seated"]).nullish(),
        showIds: z.array(showId).nullish(),
        sort: z.enum(["date", "sellThrough", "lastSevenDays"]).nullish(),
        limit: z.number().int().min(1).max(16).nullish(),
      }),
      description:
        "Doorlist's table of shows: date, title, tickets sold against capacity, the last seven days, revenue and pace. Doorlist fetches the rows that match: filter by month, pace or layout, or list showIds; sort by date (the default), sellThrough or lastSevenDays, lowest first.",
    },
    SalesChart: {
      props: z.object({ showId }),
      description: "Bars of tickets sold per day for one show, over the last four weeks.",
    },
    TierBreakdown: {
      props: z.object({ showId }),
      description: "One show's ticket types, with the price, how many have sold and how many are left.",
    },
    Callout: {
      props: z.object({ tone: z.enum(["info", "warning", "bad"]), title: words, text: words.nullish() }),
      description: "A short highlighted note in words: how to read the answer, or a next step to consider. You haven't seen any figures, so never say how a show is selling or compare shows: the other components show that from Doorlist's data. No figures or dates.",
    },
  },
  actions: {},
});
