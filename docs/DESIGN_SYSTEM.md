# Design system

`design.md` is the authority. This file records how it is implemented.

## Tokens (`src/app/globals.css`)
| Token | Light | Use |
|---|---|---|
| `bg` | `#F8FAF9` | Page |
| `card` | `#FFFFFF` | Cards, sheets |
| `ink` / `ink2` | `#111827` / `#5B6472` | Text / secondary text |
| `line` | `#E5E7EB` | Borders |
| `fill` | `#F0F3F1` | Neutral fills, segmented track |
| `primary` | `#008236` | Filled buttons, selection (white text 4.9:1) |
| `green` | `#086B32` | Green text and icons |
| `tint` | `#EAF8EE` | Selected and recommended surfaces |
| `accent` | `#F7C948` | Logo steam only |
| `danger` | `#B42318` | Errors, always with text |
| `warn` | `#7A4B00` on `#FFF6DA` | Estimated, demo, expired |

Dark values are defined for `prefers-color-scheme: dark`. Radii: `rounded-card` 16px, `rounded-btn` 12px. Side padding 20px (`safe-x`). Spacing on the 4/8px scale.

## Type
System font stack. Title 28px bold, section 20px semibold, body 16–17px, supporting 14–15px, labels 12–13px. Prices use `tabular-nums`. Layouts hold at 200% text size.

## Components
| design.md name | File |
|---|---|
| AppHeader, StepProgress, StickyCTA, TabBar | `components/layout/screen.tsx` |
| LocationPicker, PromptComposer, RecentSearchRow | `components/home/` |
| BranchCard, QuantityStepper | `components/restaurant/` |
| OrderSummary, ScreenshotUpload (`SourceCard`), PriceInput, SourceStatus, RecommendationCard, ComparisonRow, PreferenceSwitch, PriceBreakdownSheet | `components/comparison/` |
| CallConsentSheet, AgentTimeline, OrderActions | `components/agent/` |
| Button, IconButton, Sheet, EmptyState, ErrorState, Notice, DemoBadge | `components/ui/` |

## Rules
- One primary (filled green) action per screen, in the sticky footer when the screen has a next step.
- Bottom tabs on Home/Savings/History; back chevron + step progress on the comparison steps; bottom sheets for edits, breakdown and consent.
- Sticky header and footer are in the layout flow (`position: sticky`), so they never cover content, and pad with `env(safe-area-inset-*)`.
- Every control is at least 44×44px. Selection uses an icon and weight as well as colour.
- No device frame, fake status bar, hero image or decorative illustration.
- Motion: one segmented-control thumb and sheet entrance; both are disabled under Reduce Motion.

## Deliberate differences from the mockups
- Food photo replaced by a neutral icon (no real dish photos exist).
- "Rapido Parcel" is "Courier estimate": no courier integration exists.
- "Place your order / Continue to pay" is replaced by "Call the restaurant".
- No robot illustration, WhatsApp button, "Track my order" or estimated ready time.
- Quick-action tiles use brand colours only.
