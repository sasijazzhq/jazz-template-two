---
name: ai-agent-workflow
description: Rules for Rusi AI's order-assistance agent. Use when changing the order state machine, restaurant calling, call consent, ElevenLabs integration, courier quotes or booking, the order timeline, or any code that acts on the user's behalf.
---

# AI agent workflow

Source of truth: `src/features/order-assistance/machine.ts` and `docs/AGENT_WORKFLOW.md`.

## Non-negotiables
- The agent may ask and report. Only the user approves an order or a courier.
- Consent to a call is not consent to buy. Consent to buy is not consent to book a courier.
- Nothing is shown as done unless an audit event recorded it, with a time and a source.
- If a capability is missing, offer the manual path. Never simulate a call, an order or tracking.

## Checklist when changing the flow
- [ ] New status or event is added to the types, to `transition()`, and to `AgentTimeline` / `OrderActions`
- [ ] Every transition is guarded by the current status; invalid events return `{ ok: false, reason }`
- [ ] `RESTAURANT_CONFIRMED` still requires `approved === true`
- [ ] Courier: real quote → user approval → booked, each a separate event
- [ ] Calls carry an idempotency key; a repeated key changes nothing
- [ ] Retries require `previousOutcomeChecked`; attempts are capped by `MAX_CALL_ATTEMPTS`
- [ ] Failure branches (`timeout`, `unavailable`, `failed`, `declined`, `cancelled`) have a UI with a way forward
- [ ] "Order placed" appears only via `isOrderPlaced()`
- [ ] "Preparing", ready times and courier status appear only if reported
- [ ] Unit tests in `tests/unit/machine.test.ts` cover the new paths, including rejected ones

## Tool permissions for a real voice agent
| Allowed | Not allowed |
|---|---|
| Say it is an AI assistant calling for a customer | Claim to be a person |
| Ask availability, final price, preparation time, courier pickup | Confirm, change or pay for an order |
| Report answers back as structured data | Share the user's phone number or address unless approved |
| End the call politely | Call again without a new consent and outcome check |

## Enabling ElevenLabs calls
Follow "Later: ElevenLabs call" in `docs/AGENT_WORKFLOW.md`. Keep `ENABLE_VOICE_CALLS` off by default and keep "Call restaurant myself" available.
