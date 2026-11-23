# Architecture

Next.js 16 App Router · TypeScript strict · Tailwind 4 · Radix Dialog · Lucide · Motion · Zod · Vitest · Playwright.

## Layers
```
Presentation   src/app/*, src/components/*        React, no business rules
Application    src/lib/store.ts, src/lib/hooks.ts  session state, capabilities, clock
Domain         src/features/*/                     pure TypeScript, unit-tested
Ports          src/lib/ports.ts                    provider interfaces
Adapters       gemini.ts, provider.ts files        external services (server-side)
```
Dependencies point downward only. Domain code never imports React or `next/*`.

## Features
| Folder | Contents |
|---|---|
| `comparison-engine` | `money.ts` (paise parsing/formatting, percentage rounding), `engine.ts` (options, ranking, savings, expiry), `explain.ts` (template explanations), `demo-data.ts` |
| `price-extraction` | `schema.ts` (Zod schema + deterministic normalisation), `gemini.ts` (server-only adapter) |
| `restaurant-discovery` | `parse-query.ts`, `provider.ts` (port + demo provider) |
| `restaurant-calling` | `provider.ts` (port + "unavailable" provider) |
| `order-assistance` | `machine.ts` (state machine + audit trail), `savings.ts` |

## Server / client split
- Screens are client components because all state is local to the device. They prerender as static shells and hydrate from `localStorage` via `useSyncExternalStore`.
- Secrets are read only in `src/lib/env.ts` (`server-only`). The client asks `GET /api/capabilities` what is available and never guesses.

## API contracts
| Route | Request | Responses |
|---|---|---|
| `GET /api/capabilities` | — | `{ screenshotExtraction, voiceCalls }` |
| `POST /api/extract` | multipart `file`, `source` (swiggy\|zomato), `quantity` | `200 { extraction }` · `400/413/415/422/429/502/504 { code, message }` · `503 not_configured` |
| `POST /api/calls` | JSON `{ idempotencyKey, restaurantName, phoneE164, itemName, quantity, consentAt }` | `200 { ok, callId }` · `501 not_configured` (always, today) · `400/429/502` |

Errors always have a machine `code` and a user-readable `message`.

## Providers
`RestaurantProvider`, `ScreenshotExtractor`, `VoiceCallProvider`, `CourierProvider`, `ComparisonRepository` are defined in or re-exported from `src/lib/ports.ts`. Real adapters must use verified, permitted integrations: no scraping, no bypassing authentication, no unofficial Swiggy/Zomato APIs.

| Port | Today |
|---|---|
| RestaurantProvider | Demo provider: sample branches for one restaurant, otherwise "enter the branch yourself" |
| ScreenshotExtractor | Gemini adapter, active only with `GEMINI_API_KEY` |
| VoiceCallProvider | Always unavailable |
| CourierProvider | Interface only; the user enters quotes |
| ComparisonRepository | Interface only; `store.ts` uses localStorage |

## Assumptions
- Brand green is `#008236`, darkened from `#008C3A` so white text on it meets WCAG AA.
- A price is "Expired" 30 minutes after it was added.
- Percentages are rounded half-up to one decimal.
- Best Balance values one minute of waiting at ₹2 (`DEFAULT_BALANCE`).
- At most 3 call attempts per order.
