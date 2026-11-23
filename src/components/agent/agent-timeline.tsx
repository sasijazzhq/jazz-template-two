import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { AuditEvent, OrderState, OrderStatus } from "@/features/order-assistance/machine";
import { formatTime } from "@/lib/hooks";

interface Step {
  label: string;
  /** The audit event that proves this step happened. */
  match: (e: AuditEvent) => boolean;
  /** Steps that are only listed once they were actually reported. */
  onlyIfReported?: boolean;
}

const to = (status: OrderStatus) => (e: AuditEvent) => e.to === status;

function stepsFor(order: OrderState): Step[] {
  const common: Step[] = [
    { label: "Call started", match: to("calling") },
    { label: "Price confirmed by restaurant", match: (e) => e.type === "DETAILS_CONFIRMED" },
    { label: "You approved the order", match: (e) => e.type === "USER_APPROVED" },
    { label: "Restaurant confirmed — order placed", match: to("restaurant_order_confirmed") },
    { label: "Preparing", match: to("preparing"), onlyIfReported: true },
    { label: "Ready for pickup", match: to("ready_for_pickup") },
  ];
  const tail: Step[] =
    order.mode === "pickup"
      ? [{ label: "Collected", match: to("complete") }]
      : [
          { label: "Courier quote checked", match: to("courier_eligibility_checked") },
          { label: "You approved the courier", match: to("courier_booking_approved") },
          { label: "Courier booked", match: to("courier_booked") },
          { label: "Delivered", match: to("complete") },
        ];
  return [...common, ...tail];
}

const SOURCE_LABEL = { user_reported: "Reported by you", agent: "Reported by Rusi AI call", system: "Recorded by Rusi" } as const;

/** Truthful timeline: a step is done only if an audit event recorded it. */
export function AgentTimeline({ order }: { order: OrderState }) {
  // Only the current attempt counts: ignore events before the latest retry.
  const lastRetry = order.events.findLastIndex((e) => e.type === "RETRY_AFTER_CHECK");
  const events = order.events.slice(lastRetry + 1);
  const steps = stepsFor(order)
    .map((step) => ({ ...step, event: events.findLast(step.match) }))
    .filter((step) => step.event || !step.onlyIfReported);
  const firstOpen = steps.findIndex((s) => !s.event);
  const closed = ["cancelled", "declined", "unavailable", "timeout", "failed"].includes(order.status);

  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => {
        const done = !!step.event;
        const current = !done && i === firstOpen && !closed;
        return (
          <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 ? <span aria-hidden className={clsx("absolute left-[11px] top-6 h-full w-0.5", done ? "bg-primary" : "bg-line")} /> : null}
            <span
              aria-hidden
              className={clsx(
                "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                done ? "border-primary bg-primary text-white" : current ? "border-primary bg-card" : "border-line bg-card",
              )}
            >
              {done ? <Check size={14} strokeWidth={3} /> : current ? <span className="size-2.5 rounded-full bg-primary" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={clsx("text-[16px] leading-snug", done || current ? "font-semibold text-ink" : "text-ink2")}>
                {step.label}
                <span className="sr-only">{done ? " — done" : current ? " — next" : " — not yet"}</span>
              </p>
              {step.event ? (
                <p className="text-[14px] text-ink2">
                  {SOURCE_LABEL[step.event.source]} · {formatTime(step.event.at)}
                </p>
              ) : current ? (
                <p className="text-[14px] text-ink2">Waiting for your update</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
