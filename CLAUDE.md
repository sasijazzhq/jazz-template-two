# Rusi AI — Claude Code instructions

Rusi AI: "Same food. Smarter spending." A mobile-first Next.js web app that compares the final cost of ordering the same food through Swiggy, Zomato, direct takeaway and takeaway + courier.

## Design authority
`design.md` (repo root) is the primary UI/UX design standard.

**Before making any UI/UX, native iOS or App Store-related change, read `design.md` and enforce its screen-by-screen acceptance criteria.**

- Follow Apple's Human Interface Guidelines and keep the approved Rusi AI visual identity. Tokens live in `src/app/globals.css`; the rationale is in `docs/DESIGN_SYSTEM.md`.
- The approved mockups are visual direction only. Where a mockup conflicts with `design.md` (device frame, fake status bar, "Continue to pay", premature "Order placed", WhatsApp/tracking CTAs), `design.md` wins.
- A screen is done only when it passes `design.md` §9, or its issues are recorded in `docs/IMPLEMENTATION_PLAN.md`.

## Hard rules
- Never commit or push without explicit permission.
- No fabricated integrations, prices, branches, distances, call states or order updates. Sample data carries a visible "Demo" label; estimates are labelled "Estimated".
- Money is integer paise, calculated in `src/features/comparison-engine`. Never use floats or LLM output for arithmetic.
- The order flow only moves through `transition()` in `src/features/order-assistance/machine.ts`. "Order placed" is shown only when `isOrderPlaced()` is true.
- API keys are server-side only (`src/lib/env.ts`, `import "server-only"`). The browser learns what is available from `/api/capabilities`.
- Controls are at least 44×44 CSS px; status is never shown by colour alone.

## Commands
```bash
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + unit tests + production build
npm run test:e2e   # Playwright at 390×844; builds and serves on :3100
```

## Where things are
- `src/app/*` — routes: `/`, `/restaurants`, `/compare`, `/results`, `/order`, `/order/status`, `/savings`, `/history`, `/api/*`
- `src/components/*` — presentation only
- `src/features/*` — domain logic (pure, unit-tested) and provider adapters
- `src/lib/store.ts` — local-first session store (localStorage)
- `docs/` — product, architecture, design system, agent workflow, data model, security, plan
- `.claude/skills/` — project skills; use the matching one before working in that area

This repo uses Next.js 16. Its APIs differ from older versions: check `node_modules/next/dist/docs/` before using a Next.js API you have not used in this repo.
