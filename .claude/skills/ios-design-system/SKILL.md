---
name: ios-design-system
description: Rusi AI's iOS-quality design system. Use before creating or changing any screen, component, style, colour, spacing, navigation or copy in src/app or src/components, and when comparing a screen with the reference mockups.
---

# iOS design system

Read `design.md` first; it wins over mockups and over this file. Implementation notes are in `docs/DESIGN_SYSTEM.md`.

## Before you write UI
- Reuse a component from `src/components` before adding one.
- Use tokens only (`bg-card`, `text-ink2`, `text-green`, `bg-primary`, `rounded-card`, `rounded-btn`). No raw hex in components, except platform marks.
- Mobile first at 390×844. The shell is `Screen` + `AppHeader` + `StickyCTA` or `TabBar`.

## Checklist for every screen
- [ ] Answers "Where am I? What does this mean? What's next?" in five seconds
- [ ] One filled primary button; it is the sticky CTA when there is a next step
- [ ] Title 28px, section 20px, body 16–17px, supporting 14–15px; prices use `tabular-nums`
- [ ] 20px side padding via `safe-x`; header and footer use `safe-top` / `safe-bottom`
- [ ] Every control ≥ 44×44px; whole rows are tappable
- [ ] Selected, pressed, focus-visible, disabled, loading, empty and error states exist
- [ ] Status has an icon or text, never colour alone; errors say how to recover
- [ ] Inputs have a `<label>`; icon buttons have `label`; live changes use `aria-live` or `role="status"`
- [ ] Long names wrap (`break-words`, `min-w-0`); no fixed heights on text containers
- [ ] No horizontal scroll at 320, 375, 390, 430px or at 200% text size
- [ ] Animations are functional and off under `prefers-reduced-motion`
- [ ] No device frame, fake status bar, hero image, decorative gradient or oversized logo
- [ ] Prices show `SourceStatus`; sample data shows `DemoBadge`

## Navigation
- Tabs: Home, Savings, History. Steps 1–3 push forward with a back chevron and `StepProgress`.
- Sheets (`Sheet`) for small edits, breakdowns and consent. Always closable with the close button and Escape.

## Matching a mockup
1. Run `npm run test:e2e`; screenshots land in `docs/screenshots/` at 390×844.
2. Compare hierarchy, spacing and density with the reference. Ignore the device frame and status bar.
3. Do not copy mockup mistakes listed in `docs/DESIGN_SYSTEM.md` ("Deliberate differences").
