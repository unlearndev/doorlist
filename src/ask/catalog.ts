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

// Filters and form fields keep what the user picks in the answer's own
// state, under /filters and /form. A table can follow a filter by pointing
// a prop at it: { "$state": "/filters/layout" }.
const filterPath = z.string().regex(/^\/filters\/[a-z]+$/, "Filters live under /filters");
const formPath = z.string().regex(/^\/form\/[a-zA-Z]+$/, "Form fields live under /form");
const followsFilter = z.object({ $state: filterPath }).strict();
export const pace = z.enum(["ahead", "on_track", "behind", "sold_out"]);
export const layout = z.enum(["standing", "seated"]);

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
        pace: z.union([pace, followsFilter]).nullish(),
        layout: z.union([layout, followsFilter]).nullish(),
        showIds: z.array(showId).nullish(),
        sort: z.enum(["date", "sellThrough", "lastSevenDays"]).nullish(),
        limit: z.number().int().min(1).max(16).nullish(),
      }),
      description:
        "Doorlist's table of shows: date, title, tickets sold against capacity, the last seven days, revenue and pace. Doorlist fetches the rows that match: filter by month, pace or layout, or list showIds; sort by date (the default), sellThrough or lastSevenDays, lowest first. pace and layout can follow a Filter instead, with { \"$state\": \"/filters/<name>\" }.",
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
    Filter: {
      props: z.object({
        label: words,
        field: z.enum(["layout", "pace"]),
        value: z.object({ $bindState: filterPath }).strict(),
      }),
      description:
        "A dropdown the user changes to filter the answer, with Doorlist's own options for the field (layout: standing or seated; pace: ahead, on_track, behind or sold_out) plus All, which is an empty string. Bind value to a path under /filters, set its starting value in /state/filters (\"\" for All), and point a ShowTable's matching prop at the same path. Changing it redraws the table without asking you again.",
    },
    ShowPicker: {
      props: z.object({ label: words, value: z.object({ $bindState: formPath }).strict() }),
      description: "A form field for choosing one of the upcoming shows. Bind value to a path under /form, and set its starting show id in /state/form.",
    },
    NumberField: {
      props: z.object({ label: words, value: z.object({ $bindState: formPath }).strict(), suffix: words.nullish() }),
      description: "A form field for a whole number, such as a percentage. Bind value to a path under /form, and set a suggested starting value in /state/form.",
    },
    Button: {
      props: z.object({ label: words, variant: z.enum(["primary", "secondary"]).nullish() }),
      description:
        'A button that runs one of Doorlist\'s actions when pressed: set on.press to { "action": "<name>", "params": { ... } }. A param can come from a form field with { "$state": "/form/<field>" }.',
    },
  },
  // The only things a button in an answer can do. Each one is handled by
  // Doorlist's own code (src/ask/actions.ts), which checks the params, and
  // anything that changes data goes through Doorlist's API and its checks.
  actions: {
    open_show: {
      params: z.object({ showId }),
      description: "Open a show's page in Doorlist.",
    },
    create_discount: {
      params: z.object({ showId, percent: z.number().int() }),
      description:
        "Open Doorlist's discount code dialog for a show, filled in with this percentage off. Staff check it there and create the code; Doorlist decides whether they're allowed to.",
    },
  },
});
