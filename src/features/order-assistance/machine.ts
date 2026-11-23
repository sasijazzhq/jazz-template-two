import type { Paise } from "@/types/domain";

/**
 * Order-assistance state machine. Pure and deterministic: every transition is
 * validated here, and the UI can only move by dispatching one of these events.
 *
 * Session stages before an option is chosen (draft → price_collected →
 * compared) are derived from the comparison session, see `sessionStage`.
 */
export type OrderStatus =
  | "option_selected"
  | "consent_requested"
  | "calling"
  | "awaiting_user_approval"
  | "restaurant_order_confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "courier_eligibility_checked"
  | "courier_booking_approved"
  | "courier_booked"
  | "complete"
  | "cancelled"
  | "declined"
  | "unavailable"
  | "timeout"
  | "failed";

export type FulfilmentMode = "courier" | "pickup";
export type EventSource = "user_reported" | "agent" | "system";

export type OrderEvent =
  | { type: "CONSENT_REQUESTED" }
  | { type: "CALL_STARTED"; mode: "manual" | "agent"; idempotencyKey: string }
  | { type: "CALL_NO_ANSWER" }
  | { type: "ITEM_UNAVAILABLE" }
  | { type: "CALL_FAILED"; note?: string }
  | { type: "DETAILS_CONFIRMED"; pricePaise: Paise; readyInMinutes?: number }
  | { type: "USER_APPROVED" }
  | { type: "USER_DECLINED" }
  | { type: "RESTAURANT_CONFIRMED" }
  | { type: "PREPARING_REPORTED" }
  | { type: "READY_REPORTED" }
  | { type: "COLLECTED" }
  | { type: "COURIER_ELIGIBILITY_CHECKED"; quotePaise: Paise }
  | { type: "COURIER_BOOKING_APPROVED" }
  | { type: "COURIER_BOOKED" }
  | { type: "DELIVERED" }
  | { type: "RETRY_AFTER_CHECK"; previousOutcomeChecked: boolean }
  | { type: "CANCELLED" };

export interface AuditEvent {
  at: string;
  type: OrderEvent["type"] | "DETAILS_RECORDED";
  from: OrderStatus;
  to: OrderStatus;
  source: EventSource;
  note?: string;
}

export interface OrderState {
  status: OrderStatus;
  mode: FulfilmentMode;
  /** The user explicitly approved item, quantity, price and restaurant. */
  approved: boolean;
  callAttempts: number;
  usedIdempotencyKeys: string[];
  confirmedPricePaise?: Paise;
  readyInMinutes?: number;
  courierQuotePaise?: Paise;
  events: AuditEvent[];
}

export const MAX_CALL_ATTEMPTS = 3;
export const TERMINAL: OrderStatus[] = ["complete", "cancelled", "declined"];
const RETRYABLE: OrderStatus[] = ["unavailable", "timeout", "failed"];

export function createOrder(mode: FulfilmentMode): OrderState {
  return { status: "option_selected", mode, approved: false, callAttempts: 0, usedIdempotencyKeys: [], events: [] };
}

export type TransitionResult = { ok: true; state: OrderState } | { ok: false; reason: string };

const reject = (reason: string): TransitionResult => ({ ok: false, reason });

export function transition(
  state: OrderState,
  event: OrderEvent,
  at: string,
  source: EventSource = "user_reported",
): TransitionResult {
  const move = (to: OrderStatus, patch: Partial<OrderState> = {}, note?: string): TransitionResult => ({
    ok: true,
    state: {
      ...state,
      ...patch,
      status: to,
      events: [...state.events, { at, type: event.type, from: state.status, to, source, note }],
    },
  });
  const s = state.status;

  switch (event.type) {
    case "CANCELLED":
      if (TERMINAL.includes(s)) return reject("This order is already closed.");
      return move("cancelled");

    case "CONSENT_REQUESTED":
      return s === "option_selected" ? move("consent_requested") : reject("Consent was already requested.");

    case "CALL_STARTED":
      if (state.usedIdempotencyKeys.includes(event.idempotencyKey)) return { ok: true, state }; // duplicate tap
      if (s !== "consent_requested") return reject("A call can only start after consent.");
      if (state.callAttempts >= MAX_CALL_ATTEMPTS) return reject("Call limit reached for this order.");
      return move(
        "calling",
        {
          callAttempts: state.callAttempts + 1,
          usedIdempotencyKeys: [...state.usedIdempotencyKeys, event.idempotencyKey],
        },
        event.mode === "manual" ? "You are calling the restaurant yourself" : "Rusi AI call",
      );

    case "CALL_NO_ANSWER":
      return s === "calling" ? move("timeout") : reject("No call is in progress.");
    case "ITEM_UNAVAILABLE":
      return s === "calling" || s === "awaiting_user_approval"
        ? move("unavailable")
        : reject("Nothing to mark unavailable.");
    case "CALL_FAILED":
      return s === "calling" ? move("failed", {}, event.note) : reject("No call is in progress.");

    case "DETAILS_CONFIRMED":
      if (s !== "calling") return reject("Details can only be recorded during a call.");
      if (!Number.isInteger(event.pricePaise) || event.pricePaise <= 0) return reject("Enter the price the restaurant quoted.");
      return move("awaiting_user_approval", {
        confirmedPricePaise: event.pricePaise,
        readyInMinutes: event.readyInMinutes,
        approved: false,
      });

    case "USER_APPROVED":
      return s === "awaiting_user_approval" && !state.approved
        ? move("awaiting_user_approval", { approved: true })
        : reject("There is nothing waiting for approval.");
    case "USER_DECLINED":
      return s === "awaiting_user_approval" ? move("declined") : reject("There is nothing to decline.");

    case "RESTAURANT_CONFIRMED":
      if (s !== "awaiting_user_approval") return reject("The restaurant has not been asked yet.");
      if (!state.approved) return reject("Your approval is required before the order is placed.");
      return move("restaurant_order_confirmed");

    case "PREPARING_REPORTED":
      return s === "restaurant_order_confirmed" ? move("preparing") : reject("Order is not confirmed yet.");
    case "READY_REPORTED":
      return s === "restaurant_order_confirmed" || s === "preparing"
        ? move("ready_for_pickup")
        : reject("Order is not confirmed yet.");

    case "COLLECTED":
      return s === "ready_for_pickup" && state.mode === "pickup"
        ? move("complete")
        : reject("Order is not ready for pickup.");

    case "COURIER_ELIGIBILITY_CHECKED":
      if (state.mode !== "courier") return reject("This order is self-pickup.");
      if (s !== "ready_for_pickup") return reject("Check the courier once the order is ready.");
      if (!Number.isInteger(event.quotePaise) || event.quotePaise <= 0) return reject("Enter the courier's real quote.");
      return move("courier_eligibility_checked", { courierQuotePaise: event.quotePaise });
    case "COURIER_BOOKING_APPROVED":
      return s === "courier_eligibility_checked"
        ? move("courier_booking_approved")
        : reject("Check courier eligibility and quote first.");
    case "COURIER_BOOKED":
      return s === "courier_booking_approved" ? move("courier_booked") : reject("Approve the courier booking first.");
    case "DELIVERED":
      return s === "courier_booked" ? move("complete") : reject("No courier is booked.");

    case "RETRY_AFTER_CHECK":
      if (!RETRYABLE.includes(s)) return reject("Nothing to retry.");
      // Never retry blindly: the previous outcome must be checked first.
      if (!event.previousOutcomeChecked) return reject("Confirm that the last call did not place an order before retrying.");
      if (state.callAttempts >= MAX_CALL_ATTEMPTS) return reject("Call limit reached for this order.");
      return move("consent_requested", { approved: false });
  }
}

/** "Order placed" may only be shown from these states. */
export function isOrderPlaced(state: OrderState): boolean {
  return state.events.some((e) => e.to === "restaurant_order_confirmed");
}
