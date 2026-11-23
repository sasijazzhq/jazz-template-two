---
name: quality-assurance
description: Rusi AI quality gates. Use before declaring any change finished, when adding or fixing tests, checking mobile layouts, accessibility, performance, failure states or regressions, and when reporting test results.
---

# Quality assurance

## Gates
```bash
npm run check
npm run test:e2e
```
`check` = ESLint, `tsc --noEmit`, Vitest, production build. Report results exactly; never say a check passed without running it.

## What each layer covers
| Layer | Location | Covers |
|---|---|---|
| Unit | `tests/unit/` | money parsing/rounding, comparison engine, order state machine, extraction normalisation, query parsing, demo provider |
| Integration | `tests/integration/` | (empty) add provider adapters with mocked HTTP here |
| E2E | `tests/e2e/flow.spec.ts` | full demo order, manual two-price flow, failed call + retry, deep links, API unavailable paths |
| Layout | `tests/e2e/layout.spec.ts` | overflow and 44px targets at 320/375/390/430, sticky CTA, 200% text, reduced motion, keyboard, unsupported voice |

## Checklist for a change
- [ ] New rule in `src/features` has a unit test, including the rejected case
- [ ] New screen or state is reached by an e2e test and added to `ROUTES` in `layout.spec.ts`
- [ ] Loading, empty, error, permission-denied and recovery states were exercised
- [ ] Demo figures still hold: ₹335 total, ₹88 saving, 20.8%
- [ ] No "Order placed", "Preparing", courier or tracking text appears without a recorded event
- [ ] Screenshots in `docs/screenshots/` were regenerated and looked at, not just produced
- [ ] Keyboard: tab order is logical, sheets trap focus and close with Escape
- [ ] Network failure: API errors show a message and a manual path

## Not automated (do by hand, record in `docs/IMPLEMENTATION_PLAN.md`)
- Real iPhone Safari: safe areas, on-screen keyboard, landscape
- VoiceOver pass
- Dark appearance contrast
- Colour contrast of any new token pair (4.5:1 text, 3:1 large text)
- Lighthouse performance and accessibility
