# Implementation plan

## Phase A — six navigable screens with labelled demo data: done
Home, Restaurant Selection, Price Collection, Smart Comparison, Order Assistance, Order Status, plus Savings and History. Deterministic comparison engine and order state machine with unit tests. Playwright checks at 320/375/390/430px.

## Phase B — screenshot extraction: written, not verified live
`/api/extract` + Gemini adapter + schema validation + review/confirm UI. Needs a `GEMINI_API_KEY` to test against real screenshots; expect prompt and schema tuning.

## Phase C — restaurant discovery: not started
Implement `RestaurantProvider` with a permitted places API (branches, addresses, distance from the user's location, verified phone numbers). Until then the user enters the branch.

## Phase D — AI calls: not started
See `AGENT_WORKFLOW.md`. Port, consent sheet, API route and state machine are ready; the ElevenLabs adapter and result webhook are not.

## Later
- Supabase persistence and accounts (`DATA_MODEL.md`).
- Courier provider with real quotes.
- Tamil localisation (strings are not yet extracted into a catalogue).
- Native iOS app; see `design.md` §8.

## Recorded issues (design.md §9)
- Not tested on physical iPhones, with VoiceOver, in landscape or with the on-screen keyboard open; only Chromium emulation.
- Dark appearance is defined but was not visually reviewed.
- Only five of six reference mockups were available; Restaurant Selection and Smart Comparison follow `design.md` text.
- The home photo attachment is kept on the device and not interpreted.
- App icon is an SVG placeholder of the bowl mark, not a 1024×1024 App Store icon.
- No offline service worker; the app is installable by manifest only.
