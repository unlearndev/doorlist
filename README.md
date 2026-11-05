# Doorlist

The box office for small music venues: upcoming shows, ticket sales on the door, discount codes, and an Ask panel where staff ask questions about their sales. One venue runs on it here, The Kestrel Rooms in Leeds (made up, like everything in the data).

It's the demo project for the Unlearn course **Ship Interactive Generative UI with AI**. Each lesson starts from a tag (`lesson-01` to `lesson-07`), and `final` is where the course ends.

## Run it

```bash
npm install
npm run dev        # the app and its API, on http://localhost:5173
npm test           # the tests
npm run typecheck  # TypeScript, no output
```

Node 22.18 or later. Sign in as one of the demo staff (the password for both is `doorlist`):

| Account | Role |
|---|---|
| maya@kestrelrooms.test | Venue manager: everything, including discount codes |
| dan@kestrelrooms.test | Box office: sells tickets, can't create discount codes |

The Ask panel calls Claude, so it needs `ANTHROPIC_API_KEY` in the environment `npm run dev` runs in. Everything else works without it. `DOORLIST_MODEL` picks a different model.

The app runs on a fixed date, 2 November 2026, so the figures always read the same. `DOORLIST_TODAY=2026-11-20 npm run dev` moves it. Data lives in memory and resets when the dev server restarts.

## What's where

- `server/`: the API, mounted on Vite's dev server (`vite.config.ts`), so one command serves the whole app
  - `shows.ts`: every figure the app shows, worked out from the tiers
  - `sales.ts`, `discounts.ts`: selling on the door, and discount codes
  - `auth.ts`: staff sign-in and roles
  - `ask/`: the Ask panel's server side
  - `data/seed.ts`: the venue and its shows, generated the same way every time
- `src/`: the React app, its components (`src/components/`) and design tokens (`src/styles/tokens.css`)
- `tests/`: Vitest tests
