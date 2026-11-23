# Agent workflow

Rusi assists with a restaurant phone order. Code: `src/features/order-assistance/machine.ts`.

## States
```
draft → price_collected → compared → option_selected      (derived from the session)
option_selected → consent_requested → calling
calling → awaiting_user_approval                           (details confirmed: price, ready time)
awaiting_user_approval —approve→ (approved) —restaurant confirms→ restaurant_order_confirmed
restaurant_order_confirmed → [preparing] → ready_for_pickup
  pickup:  ready_for_pickup → complete
  courier: ready_for_pickup → courier_eligibility_checked → courier_booking_approved → courier_booked → complete
```
Branches: `timeout` (no answer), `unavailable`, `failed`, `declined`, `cancelled`.

## Guarantees
| Rule | How it is enforced |
|---|---|
| A call needs consent | `CALL_STARTED` only from `consent_requested` |
| A call never authorises a purchase | `RESTAURANT_CONFIRMED` is rejected unless `approved` is true |
| Courier is a separate decision | Needs a real quote, then its own approval, before `COURIER_BOOKED` |
| No duplicate calls | Idempotency key per call; a repeated key is a no-op |
| No blind retries | `RETRY_AFTER_CHECK` needs `previousOutcomeChecked: true` |
| Rate limit | 3 call attempts per order; `/api/calls` allows 3 per 10 minutes per client |
| "Order placed" is truthful | UI shows it only when `isOrderPlaced()` finds the audit event |
| Audit trail | Every transition appends `{ at, type, from, to, source }` |

## Sources
Each event has a source: `user_reported` (today, always), `agent`, or `system`. The timeline prints it with the time.

## Today: guided manual call
Automated calling is not implemented. The user calls the restaurant, and reports each outcome; Rusi provides the script, the approval step and the record. Nothing advances by itself and no times are invented.

## Later: ElevenLabs call (Phase D)
Implement `VoiceCallProvider` and return it from `voiceCallProvider()` when `serverEnv().voiceCallsEnabled`. Requirements before enabling:
1. The agent states it is an AI assistant at the start of the call.
2. Its tools can only ask and report; it cannot confirm an order.
3. Call results arrive by signed webhook and are applied with `source: "agent"`.
4. The restaurant phone number is verified, not guessed.
5. `CallConsentSheet` is shown for every call.
