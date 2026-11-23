# Rusi AI — iOS Design Guidelines
**Version:** 1.0 · **Updated:** 23 Nov 2026  
**Purpose:** Single design authority for Rusi AI, mobile-first web today and native iOS/App Store readiness later.

> **Claude Code instruction:** Before editing UI, read this file and all six approved Rusi AI screenshots. PAUSE unrelated development; first align the design system, then implement screen by screen. Do not commit or push without permission. Treat references as design inspiration, not assets to paste into the interface.

## 1. Product principles
Rusi AI helps users find the smartest way to order equivalent food based on final costs, time, and convenience. The experience must feel like an authentic iPhone consumer application, **not** an infographic, landing page, or promotional banner.

- Clear hierarchy, familiar navigation, one primary action per screen.
- Prefer useful content over big illustrations, oversized logo, gradients, and decorative elements.
- Display real and estimated prices differently. Explain recommendations simply.
- Never place orders, call restaurants, or book couriers without appropriate user consent and approval.
- Keep Tamil Nadu relevance but use universal, clean UI patterns.

## 2. Brand tokens (Rusi choices, not Apple requirements)
| Role | Token |
|---|---|
| Primary green | `#008C3A` (adjust if necessary for accessible contrast) |
| Deep green | `#086B32` |
| Green tint | `#EAF8EE` |
| Accent yellow | `#F7C948` (logo/decor only) |
| Background | `#F8FAF9` |
| Card | `#FFFFFF` |
| Main text | `#111827` |
| Secondary text | `#5B6472` |
| Borders | `#E5E7EB` |
| Error | `#B42318` plus explanatory text |
| Spacing | `4, 8, 12, 16, 20, 24, 32pt` |
| Screen side padding | `20pt` typical compact iPhone |
| Card/button radius | `16pt` / `12pt` |

**Typography:** native iOS system font (SF); on web `system-ui, -apple-system, BlinkMacSystemFont, sans-serif`. Use approximately 28–30pt screen titles, 20–22pt section headers, 16–17pt body, 14–15pt supporting, tabular numerals for prices. Support Dynamic Type in native apps and 200% text zoom on web. Never distribute bundled Apple font files.

**Iconography:** approved green/yellow steaming-bowl Rusi mark; SF Symbols for native iOS, consistent Lucide icons for web. Keep labels for non-obvious icons. The icon-only brand mark is distinct from a full horizontal logo.

## 3. Apple-style interaction and layout
- Respect **safe areas** (notch, Dynamic Island, home indicator) and system keyboard; never fake a status bar or embed a black iPhone device frame inside the real app. Device mockups are only for presentations.
- Aim for **at least 44×44pt hit targets** in native iOS (at least 44×44 CSS px for web). Make interactive rows fully tappable.
- Navigation: bottom tabs for Home / Savings / History; push-style navigation for comparison steps; sheets for price breakdown, small edits and order consent.
- Sticky CTAs must remain visible without covering content and must include safe-area spacing. On web, use `env(safe-area-inset-bottom)` appropriately.
- Use appropriate pressed, selected, focus, disabled, loading and error states. Allow clear back/cancel paths.
- Use subtle transitions only when helping orientation. Respect **Reduce Motion**. Avoid ornamental glass/blur; use current iOS materials when functionally appropriate.
- Test responsive behavior at **320, 375, 390, 430px** widths, larger phones, landscape, open keyboard, large text and tablet widths if supported.
- Support light and dark appearance for eventual native release, with sufficient contrast in each mode.

## 4. Screen designs (approved visual direction)
### 01 Home `/`
Compact Rusi AI header; permission-aware location selector; headline **What are you craving?**; AI prompt with typing, image upload and working voice input if supported; quick actions; recent searches; Home/Savings/History tabs. **No large food image or marketing hero.**

### 02 Restaurant Selection `/restaurants`
Step 1/3. Editable food/order summary. Single-select restaurant branch cards showing grounded address/distance; quantity stepper. Sticky **Continue to price comparison**. Handle no branches/unclear matches. Never fabricate restaurant locations or travel times.

### 03 Price Collection `/compare`
Step 2/3. Compact order summary. Four vertically stacked inputs: Swiggy screenshot, Zomato screenshot, direct takeaway price, estimated courier charge. Review extracted amounts before comparison; show uploaded/processing/error/needs correction states. Allow a comparison with **two valid comparable alternatives**. CTA **Compare my options**.

### 04 Smart Comparison `/results`
Step 3/3. Savings card, Cheapest/Fastest/Best Balance selector, price rows and a short AI recommendation; price breakdown in a bottom sheet. Home-delivery options and self-pickup shown distinctly. Example values only for DEMO: Swiggy ₹423, Zomato ₹395, takeaway ₹280, estimated courier ₹55, combined ₹335, potential saving ₹88 compared with Swiggy (~20.8%). Label estimates and source freshness. CTA **Let Rusi help me order**.

### 05 Agent Call Consent `/order`
Explain exactly what Rusi AI will do: call the restaurant, disclose it is an AI assistant, confirm final price/availability/preparation time and ask whether a courier may pick up. Clear opt-in CTA **Let Rusi AI call now**; fallback **Call restaurant myself**. A call authorization does **not** authorize a purchase or courier booking; request separate approval before committing.

### 06 Order Status `/order/status`
Truthful timeline: Awaiting call → Calling → Connected → Price confirmed → Awaiting approval → Restaurant confirmed → Preparing (only if reported) → Ready → Courier eligibility/booked (only if real). **Order placed** only after verified restaurant confirmation. Handle unavailable/failed/cancelled states. Never fabricate updates, times, WhatsApp integration or delivery tracking.

## 5. Components and states
Build reusable `AppHeader`, `LocationPicker`, `PromptComposer`, `RecentSearchRow`, `StepProgress`, `BranchCard`, `QuantityStepper`, `OrderSummary`, `ScreenshotUpload`, `PriceInput`, `SourceStatus`, `RecommendationCard`, `ComparisonRow`, `PreferenceSwitch`, `PriceBreakdownSheet`, `CallConsentSheet`, `AgentTimeline`, `StickyCTA`, `EmptyState`, `ErrorState`. Every action must be operable. Never use color as the only indicator.

## 6. Price/AI trust rules
- Compare equivalent restaurant **items, portions, quantities**, and **final payable amounts**, not just listing prices.
- Calculate using deterministic TypeScript and **integer paise**, not AI-generated arithmetic.
- Show source status: `Verified checkout`, `User-entered`, `AI extracted — review`, `Estimated`, `Expired`, `Unavailable`.
- Say **Best among compared options**, not **Cheapest everywhere** when data is incomplete.
- AI claims should match actual capability. Do not simulate automated calls or live orders as real.
- Explain data sent to Gemini/ElevenLabs; request permission where required, minimize retention, secure uploads, and offer deletion controls.

## 7. Accessibility, language and usability
- Aim for at least WCAG AA text contrast (typically **4.5:1**, or **3:1** for large text); verify against rendered surfaces.
- Provide VoiceOver/screen-reader labels, logical focus, dynamic text, text alternatives, non-color status, and usable errors.
- Ensure Tamil localization can be added: allow longer strings, proper line wrapping and Indian rupee formatting. Don't embed English UI labels in images.
- Every screen answers: **Where am I? What does this mean? What's next?** within five seconds.

## 8. App Store readiness: NOT the same as a PWA
A **Next.js PWA cannot be submitted directly as an iOS App Store binary**. An actual native/buildable iOS app is required. A thin wrapper of a website may fail **Apple App Review Guideline 4.2 (Minimum Functionality)**; native-capable UX and useful functionality matter. Following this file does **not** guarantee App Store approval.

Before a native submission:
- [ ] Test on physical iPhones; no dead CTAs, fake payment, fake order confirmation, broken links or placeholder features.
- [ ] Provide a clear **privacy policy in the app and App Store Connect**, correct data collection/sharing/retention/deletion disclosures, and consent for third-party AI data sharing as applicable.
- [ ] Request location, microphone and photo permissions **when relevant** with clear purposes and fallback when denied.
- [ ] Prepare a **1024×1024px app icon** using current Apple icon guidance; adapt the Rusi symbol for icon variants rather than using the transparent horizontal wordmark directly.
- [ ] Capture **real screenshots of working functionality**; check current App Store Connect device dimensions and assets at submission.
- [ ] Provide App Review credentials/demo instructions and explain external providers and AI functionality in review notes.
- [ ] Verify current Xcode/SDK, build, signing, privacy, entitlement and distribution requirements at submission time.

## 9. Acceptance criteria for every UI screen
1. Compare **390×844 rendered screenshot** against the approved reference, but render without a device frame.
2. Check 320/375/390/430 layouts, safe areas, sticky CTA, open keyboard, long content, 200% text zoom.
3. Check 44pt touch targets, focus, VoiceOver labels, visual contrast and Reduce Motion.
4. Verify loading, success, permission, failed, empty and recovery states.
5. Check prices and labels against source/verification state. **No fabricated integrations.**
6. Run typecheck, lint, build, unit and browser tests. Report failures honestly.
7. Do not proceed to the next screen until the current screen passes review (or issues are explicitly recorded).

## 10. Official references — re-check before submission
- Apple HIG: https://developer.apple.com/design/human-interface-guidelines/
- Designing for iOS: https://developer.apple.com/design/human-interface-guidelines/designing-for-ios
- Layout: https://developer.apple.com/design/human-interface-guidelines/layout
- Typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Buttons: https://developer.apple.com/design/human-interface-guidelines/buttons
- Generative AI: https://developer.apple.com/design/human-interface-guidelines/generative-ai
- App icons: https://developer.apple.com/design/human-interface-guidelines/app-icons
- App Review: https://developer.apple.com/app-store/review/guidelines/
- Screenshot specs: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications

**CLAUDE.md rule to add:** `Before making any UI/UX, native iOS or App Store-related change, read design.md and enforce its screen-by-screen acceptance criteria.`
