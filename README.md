# Rusi AI

**Same food. Smarter spending.** Compare the final cost of one order across Swiggy, Zomato, direct takeaway and takeaway + courier, then get guided through ordering the best option.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 on a phone-sized viewport. No API keys are needed: tap **Try a sample order**, then **Fill with sample prices**.

## Checks

```bash
npm run check
npm run test:e2e
```

## What is real and what is not

| Capability | State |
|---|---|
| Six connected screens, Savings, History | Working |
| Price comparison (integer paise, deterministic) | Working |
| Typing prices, quantity, branch, preferences | Working |
| Guided manual restaurant call + order timeline | Working; every update is reported by the user |
| Voice input | Working where the browser supports speech recognition |
| Reading checkout screenshots | Needs `GEMINI_API_KEY`; code path written but not tested against the live API |
| Listing real restaurant branches and distances | Not implemented; needs a places provider |
| Rusi AI phone calls (ElevenLabs) | Not implemented; interface and consent UI only |
| Courier quotes and booking | Not implemented; user enters the quote |
| Accounts and cloud sync (Supabase) | Not implemented; schema designed, data stays in the browser |
| Payments, placing orders in Swiggy/Zomato | Out of scope; never simulated |

Copy `.env.example` to `.env.local` to configure integrations. See `docs/` for details and `design.md` for the design standard.
