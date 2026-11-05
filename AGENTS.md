# Doorlist

A box office app for small music venues. Vite + React + TypeScript, with the API mounted on Vite's dev server (`vite.config.ts`, `server/api.ts`). Data is in memory, seeded from `server/data/seed.ts`.

- Run: `npm run dev` (port 5173). Test: `npm test`. Type check: `npm run typecheck`.
- Every figure the app shows is worked out in `server/shows.ts`. Don't compute figures anywhere else.
- Every API route except sign-in needs a signed-in member of staff (`server/auth.ts`). Permission checks live on the server, never only in the UI.
- Components are in `src/components/`, styles and design tokens in `src/styles/`. Use the tokens, never raw colours.
- Money is stored in pence.
