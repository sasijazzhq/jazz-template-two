import { describe, expect, it } from "vitest";
import { MAX_CALL_ATTEMPTS, type OrderEvent, type OrderState, createOrder, isOrderPlaced, transition } from "@/features/order-assistance/machine";

const AT = "2026-11-23T10:00:00.000Z";
function run(state: OrderState, ...events: OrderEvent[]): OrderState {
  return events.reduce((s, e) => {
    const r = transition(s, e, AT);
    if (!r.ok) throw new Error(`${e.type}: ${r.reason}`);
    return r.state;
  }, state);
}
const call = (key: string): OrderEvent => ({ type: "CALL_STARTED", mode: "manual", idempotencyKey: key });
const toApproval = (mode: "courier" | "pickup") =>
  run(createOrder(mode), { type: "CONSENT_REQUESTED" }, call("k1"), { type: "DETAILS_CONFIRMED", pricePaise: 28000, readyInMinutes: 20 });

describe("order state machine", () => {
  it("walks the courier happy path with an audit trail", () => {
    const s = run(
      toApproval("courier"),
      { type: "USER_APPROVED" },
      { type: "RESTAURANT_CONFIRMED" },
      { type: "PREPARING_REPORTED" },
      { type: "READY_REPORTED" },
      { type: "COURIER_ELIGIBILITY_CHECKED", quotePaise: 5500 },
      { type: "COURIER_BOOKING_APPROVED" },
      { type: "COURIER_BOOKED" },
      { type: "DELIVERED" },
    );
    expect(s.status).toBe("complete");
    expect(s.events).toHaveLength(11);
    expect(s.events.every((e) => e.at === AT && e.source === "user_reported")).toBe(true);
    expect(s.confirmedPricePaise).toBe(28000);
    expect(s.courierQuotePaise).toBe(5500);
  });

  it("never places an order without explicit approval", () => {
    const waiting = toApproval("pickup");
    expect(isOrderPlaced(waiting)).toBe(false);
    expect(transition(waiting, { type: "RESTAURANT_CONFIRMED" }, AT).ok).toBe(false);
    const placed = run(waiting, { type: "USER_APPROVED" }, { type: "RESTAURANT_CONFIRMED" });
    expect(isOrderPlaced(placed)).toBe(true);
  });

  it("requires consent before a call and ignores duplicate taps", () => {
    expect(transition(createOrder("pickup"), call("k1"), AT).ok).toBe(false);
    const calling = run(createOrder("pickup"), { type: "CONSENT_REQUESTED" }, call("k1"));
    const again = transition(calling, call("k1"), AT);
    expect(again.ok && again.state).toBe(calling);
    expect(calling.callAttempts).toBe(1);
  });

  it("does not retry without checking the previous outcome, and caps attempts", () => {
    let s = run(createOrder("pickup"), { type: "CONSENT_REQUESTED" }, call("k1"), { type: "CALL_NO_ANSWER" });
    expect(s.status).toBe("timeout");
    expect(transition(s, { type: "RETRY_AFTER_CHECK", previousOutcomeChecked: false }, AT).ok).toBe(false);
    for (let i = 2; i <= MAX_CALL_ATTEMPTS; i++) {
      s = run(s, { type: "RETRY_AFTER_CHECK", previousOutcomeChecked: true }, call(`k${i}`), { type: "CALL_NO_ANSWER" });
    }
    expect(s.callAttempts).toBe(MAX_CALL_ATTEMPTS);
    expect(transition(s, { type: "RETRY_AFTER_CHECK", previousOutcomeChecked: true }, AT).ok).toBe(false);
  });

  it("keeps courier booking a separate, verified step", () => {
    const ready = run(toApproval("courier"), { type: "USER_APPROVED" }, { type: "RESTAURANT_CONFIRMED" }, { type: "READY_REPORTED" });
    expect(transition(ready, { type: "COURIER_BOOKED" }, AT).ok).toBe(false);
    expect(transition(ready, { type: "COURIER_BOOKING_APPROVED" }, AT).ok).toBe(false);
    expect(transition(ready, { type: "COURIER_ELIGIBILITY_CHECKED", quotePaise: 0 }, AT).ok).toBe(false);
    expect(transition(ready, { type: "COLLECTED" }, AT).ok).toBe(false); // courier order, not pickup
  });

  it("handles decline, unavailable and cancel branches", () => {
    expect(run(toApproval("pickup"), { type: "USER_DECLINED" }).status).toBe("declined");
    expect(run(toApproval("pickup"), { type: "ITEM_UNAVAILABLE" }).status).toBe("unavailable");
    const cancelled = run(toApproval("pickup"), { type: "CANCELLED" });
    expect(cancelled.status).toBe("cancelled");
    expect(transition(cancelled, { type: "CANCELLED" }, AT).ok).toBe(false);
    expect(transition(cancelled, { type: "USER_APPROVED" }, AT).ok).toBe(false);
  });

  it("rejects out-of-order events", () => {
    const fresh = createOrder("pickup");
    for (const e of [{ type: "READY_REPORTED" }, { type: "DELIVERED" }, { type: "USER_APPROVED" }, { type: "CALL_NO_ANSWER" }] as OrderEvent[]) {
      expect(transition(fresh, e, AT).ok).toBe(false);
    }
  });
});
