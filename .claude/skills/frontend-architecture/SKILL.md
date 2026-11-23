---
name: frontend-architecture
description: Rusi AI code structure and conventions. Use when adding or moving files, creating routes, API handlers, providers, state, or domain logic, or when deciding where code belongs in this Next.js App Router project.
---

# Frontend architecture

Details: `docs/ARCHITECTURE.md`. This repo uses Next.js 16; read `node_modules/next/dist/docs/` before using an unfamiliar Next API.

## Where code goes
| Kind of code | Place |
|---|---|
| Route, screen composition | `src/app/<route>/page.tsx` (default export only) |
| Reusable UI | `src/components/<area>/` |
| Business rules, maths, state machines | `src/features/<feature>/` — pure TS, no React |
| External service call | adapter in the feature, behind a port in `src/lib/ports.ts`, `import "server-only"` |
| Session state | `src/lib/store.ts` actions (`patchSession`, `dispatchOrder`) |
| Shared types | `src/types/domain.ts` |

## Rules
- [ ] TypeScript strict; no `any`, no non-null `!` on external data
- [ ] Money is integer paise; parse with `parseRupeesToPaise`, print with `formatINR`
- [ ] Components never calculate totals or savings; they call the engine
- [ ] Order status changes only through `dispatchOrder()` → `transition()`
- [ ] Renders are pure: no `Date.now()` or `localStorage` in render; use `useNow()`, `useStore()`, `useHydrated()`
- [ ] Changing item, restaurant, quantity or a price resets `compared`, `selectedOptionId` and `order`
- [ ] Secrets only in `src/lib/env.ts`; expose a boolean through `/api/capabilities`
- [ ] API input is validated with Zod; errors return `{ code, message }` with a correct status
- [ ] Anything from an LLM or the network is validated before use
- [ ] A missing integration yields a truthful empty/manual state, never fake data

## Adding a provider
1. Define or extend the port.
2. Write the adapter (server-only), with timeout and typed errors.
3. Return it from the factory only when its env vars are set.
4. Add the capability flag; branch the UI on it.
5. Unit-test the pure parts; e2e-test the unavailable path.

## Before finishing
`npm run check` and `npm run test:e2e` must pass. Update `docs/` when behaviour or contracts change.
