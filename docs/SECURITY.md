# Security and privacy

## Data flows
| Data | Goes to | When | Kept |
|---|---|---|---|
| Searches, prices, order notes, location | Nowhere; browser localStorage | Always | Until the user deletes it |
| Checkout screenshot | Google Gemini, via `/api/extract` | Only if `GEMINI_API_KEY` is set and the user uploads | Not stored or logged by Rusi; in memory for the request |
| Device location | Nowhere | Only when the user taps "Use my current location" | In localStorage |
| Microphone audio | The browser's speech-recognition service | Only while the user uses voice input | Not by Rusi |
| Restaurant call | ElevenLabs (planned) | Not implemented | — |

The UI states these in **Privacy and data** (Home header) and next to the upload button.

## Controls in place
- Secrets are server-only (`src/lib/env.ts`); no `NEXT_PUBLIC_` keys. `.env*` is git-ignored.
- `/api/extract`: type allow-list (PNG/JPEG/WebP), 5 MB limit, 10 requests/minute per client, 25s timeout, Zod validation of model output, prompt tells the model to ignore instructions in the image. Model output is data: amounts are re-parsed and checked in TypeScript and the user must confirm them.
- `/api/calls`: Zod validation, idempotency key, 3 per 10 minutes.
- No LLM output is rendered as HTML or used for arithmetic.
- Permissions (location, microphone) are requested only on a user action, with a fallback when denied.

## Known gaps before production
- Rate limiting is in-memory per server instance; use a shared store.
- No authentication, CSRF protection or abuse controls beyond the above; add them with accounts.
- No Content-Security-Policy or security headers are configured.
- The Gemini path has not been exercised against the live API.
- A privacy policy page and consent records are needed before any real third-party sharing or App Store submission.
