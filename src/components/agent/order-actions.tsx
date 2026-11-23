"use client";

import { useState } from "react";
import { PriceInput, MinutesInput } from "@/components/comparison/price-input";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, ErrorState, FieldError, Notice } from "@/components/ui/feedback";
import { formatINR } from "@/features/comparison-engine/money";
import { MAX_CALL_ATTEMPTS, type OrderEvent, type OrderState } from "@/features/order-assistance/machine";
import { type Session, dispatchOrder } from "@/lib/store";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 border-primary/40 p-4">
      <h2 className="text-[20px] font-semibold leading-tight">{title}</h2>
      {children}
    </Card>
  );
}

/**
 * The one thing the user can do next. Every update is something the user
 * reports; Rusi never advances the order by itself.
 */
export function OrderActions({ session, order, expectedFoodPaise, expectedCourierPaise }: { session: Session; order: OrderState; expectedFoodPaise?: number; expectedCourierPaise?: number }) {
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | undefined>();
  const [quote, setQuote] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const send = (event: OrderEvent) => setError(dispatchOrder(event));
  const err = error ? <FieldError>{error}</FieldError> : null;
  const p = "text-[15px] leading-relaxed text-ink";

  switch (order.status) {
    case "option_selected":
      return (
        <Panel title="Not started">
          <p className={p}>You haven&apos;t called the restaurant yet.</p>
          <ButtonLink href="/order">Review the call</ButtonLink>
        </Panel>
      );
    case "consent_requested":
      return (
        <Panel title="Ready to call">
          <p className={p}>Call {session.restaurantName} when you&apos;re ready, then tell Rusi how it went.</p>
          <Button onClick={() => send({ type: "CALL_STARTED", mode: "manual", idempotencyKey: crypto.randomUUID() })}>I&apos;m calling now</Button>
          {err}
        </Panel>
      );
    case "calling":
      return (
        <Panel title="On the call">
          <p className={p}>Ask for the final takeaway price for {session.itemName} × {session.quantity}, and how long it will take. Don&apos;t confirm the order yet.</p>
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-end gap-2">
            <PriceInput label="Price the restaurant quoted" valuePaise={undefined} onChange={setPrice} />
            <MinutesInput label="Ready in" value={undefined} onChange={setMinutes} />
          </div>
          <Button
            onClick={() => (price ? send({ type: "DETAILS_CONFIRMED", pricePaise: price, readyInMinutes: minutes }) : setError("Enter the price the restaurant quoted."))}
          >
            Save what they said
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => send({ type: "CALL_NO_ANSWER" })}>No answer</Button>
            <Button variant="secondary" onClick={() => send({ type: "ITEM_UNAVAILABLE" })}>Not available</Button>
          </div>
          {err}
        </Panel>
      );
    case "awaiting_user_approval": {
      const confirmed = order.confirmedPricePaise ?? 0;
      const diff = expectedFoodPaise !== undefined ? confirmed - expectedFoodPaise : 0;
      if (order.approved) {
        return (
          <Panel title="Tell the restaurant to go ahead">
            <p className={p}>You approved {formatINR(confirmed)}. Ask the restaurant to place the order, then report what they said.</p>
            <Button onClick={() => send({ type: "RESTAURANT_CONFIRMED" })}>Restaurant confirmed my order</Button>
            <Button variant="secondary" onClick={() => send({ type: "ITEM_UNAVAILABLE" })}>They couldn&apos;t take the order</Button>
            {err}
          </Panel>
        );
      }
      return (
        <Panel title="Approve this order?">
          <dl className="flex flex-col gap-1.5 text-[15px]">
            {[
              ["Restaurant", `${session.restaurantName}${session.branch ? `, ${session.branch.area}` : ""}`],
              ["Order", `${session.itemName} × ${session.quantity}`],
              ["Price quoted on the call", formatINR(confirmed)],
              ...(order.readyInMinutes ? [["Ready in", `${order.readyInMinutes} min`]] : []),
              ["Pickup", order.mode === "pickup" ? "You collect it" : "Courier, booked separately"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-ink2">{k}</dt>
                <dd className="min-w-0 break-words text-right font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          {diff !== 0 ? (
            <Notice tone={diff > 0 ? "warn" : "info"}>
              {formatINR(Math.abs(diff))} {diff > 0 ? "more" : "less"} than the {formatINR(expectedFoodPaise!)} you entered earlier.
            </Notice>
          ) : null}
          <p className="text-[14px] text-ink2">Nothing is ordered until you approve and the restaurant confirms.</p>
          <Button onClick={() => send({ type: "USER_APPROVED" })}>Approve this order</Button>
          <Button variant="secondary" onClick={() => send({ type: "USER_DECLINED" })}>Decline</Button>
          {err}
        </Panel>
      );
    }
    case "restaurant_order_confirmed":
    case "preparing":
      return (
        <Panel title={order.status === "preparing" ? "Being prepared" : "Waiting on the restaurant"}>
          <p className={p}>Rusi can&apos;t see the kitchen. Update this when the restaurant tells you something.</p>
          {order.status === "restaurant_order_confirmed" ? (
            <Button variant="secondary" onClick={() => send({ type: "PREPARING_REPORTED" })}>They said it&apos;s being prepared</Button>
          ) : null}
          <Button onClick={() => send({ type: "READY_REPORTED" })}>It&apos;s ready for pickup</Button>
          {err}
        </Panel>
      );
    case "ready_for_pickup":
      if (order.mode === "pickup") {
        return (
          <Panel title="Ready to collect">
            <p className={p}>Pay the restaurant {formatINR(order.confirmedPricePaise ?? 0)} when you collect it.</p>
            <Button onClick={() => send({ type: "COLLECTED" })}>I&apos;ve collected it</Button>
            {err}
          </Panel>
        );
      }
      return (
        <Panel title="Get a real courier quote">
          <p className={p}>
            Open your courier app and check it will pick up from this restaurant. Enter the price it shows
            {expectedCourierPaise ? ` (your estimate was ${formatINR(expectedCourierPaise)})` : ""}.
          </p>
          <PriceInput label="Courier quote" valuePaise={undefined} onChange={setQuote} />
          <Button onClick={() => (quote ? send({ type: "COURIER_ELIGIBILITY_CHECKED", quotePaise: quote }) : setError("Enter the courier's quote."))}>Save courier quote</Button>
          {err}
        </Panel>
      );
    case "courier_eligibility_checked": {
      const total = (order.confirmedPricePaise ?? 0) + (order.courierQuotePaise ?? 0);
      return (
        <Panel title="Approve the courier?">
          <p className={p}>
            Food {formatINR(order.confirmedPricePaise ?? 0)} + courier {formatINR(order.courierQuotePaise ?? 0)} ={" "}
            <span className="font-semibold tabular-nums">{formatINR(total)}</span>.
          </p>
          <p className="text-[14px] text-ink2">Rusi doesn&apos;t book couriers. Approving records your decision; you book in the courier app.</p>
          <Button onClick={() => send({ type: "COURIER_BOOKING_APPROVED" })}>Approve courier at this price</Button>
          {err}
        </Panel>
      );
    }
    case "courier_booking_approved":
      return (
        <Panel title="Book the courier">
          <p className={p}>Book the pickup in your courier app, then confirm here.</p>
          <Button onClick={() => send({ type: "COURIER_BOOKED" })}>I&apos;ve booked the courier</Button>
          {err}
        </Panel>
      );
    case "courier_booked":
      return (
        <Panel title="Courier booked">
          <p className={p}>Track the rider in your courier app. Rusi has no live tracking.</p>
          <Button onClick={() => send({ type: "DELIVERED" })}>My order was delivered</Button>
          {err}
        </Panel>
      );
    case "complete":
      return (
        <Panel title={order.mode === "pickup" ? "Collected" : "Delivered"}>
          <p className={p}>
            You reported paying {formatINR((order.confirmedPricePaise ?? 0) + (order.courierQuotePaise ?? 0))} in total. It&apos;s saved in your history.
          </p>
          <ButtonLink href="/savings">See my savings</ButtonLink>
          <ButtonLink href="/" variant="secondary">Start a new search</ButtonLink>
        </Panel>
      );
    case "cancelled":
    case "declined":
      return (
        <Panel title={order.status === "declined" ? "You declined the order" : "Cancelled"}>
          <p className={p}>Nothing more will happen here. If the restaurant already took your order, call them to cancel it.</p>
          <ButtonLink href="/results">Back to my options</ButtonLink>
        </Panel>
      );
    case "timeout":
    case "unavailable":
    case "failed": {
      const left = MAX_CALL_ATTEMPTS - order.callAttempts;
      const title = order.status === "timeout" ? "The restaurant didn't answer" : order.status === "unavailable" ? "The restaurant can't take this order" : "The call didn't go through";
      return (
        <ErrorState title={title}>
          <p>No order was placed. You can try again or pick another option.</p>
          {left > 0 ? (
            <>
              <label className="flex min-h-11 items-start gap-3">
                <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 size-5 accent-[var(--primary)]" />
                <span>I&apos;m sure the last call did not place an order.</span>
              </label>
              <Button onClick={() => send({ type: "RETRY_AFTER_CHECK", previousOutcomeChecked: checked })}>
                Try calling again ({left} left)
              </Button>
            </>
          ) : (
            <p>You&apos;ve reached the limit of {MAX_CALL_ATTEMPTS} calls for this order.</p>
          )}
          <ButtonLink href="/results" variant="secondary">Back to my options</ButtonLink>
          {err}
        </ErrorState>
      );
    }
  }
}
