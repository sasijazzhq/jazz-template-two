"use client";

import { CircleCheck } from "lucide-react";
import { AgentTimeline } from "@/components/agent/agent-timeline";
import { OrderActions } from "@/components/agent/order-actions";
import { OrderSummary } from "@/components/comparison/order-summary";
import { AppHeader, Screen, SectionTitle } from "@/components/layout/screen";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/feedback";
import { WithSession } from "@/components/ui/guards";
import { TERMINAL, isOrderPlaced } from "@/features/order-assistance/machine";
import { type Session, dispatchOrder } from "@/lib/store";

function Content({ session }: { session: Session }) {
  const order = session.order;
  if (!order) {
    return (
      <EmptyState title="No order in progress">
        <p>Compare your options and choose takeaway to get help ordering.</p>
        <ButtonLink href="/results">See my options</ButtonLink>
      </EmptyState>
    );
  }
  const placed = isOrderPlaced(order);
  const open = !TERMINAL.includes(order.status);
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-[28px] font-bold leading-tight tracking-tight">
          {placed ? <CircleCheck aria-hidden size={28} className="shrink-0 text-green" /> : null}
          {placed ? "Order placed" : "Order status"}
        </h1>
        <p className="text-[16px] text-ink2">
          {placed
            ? "You reported that the restaurant confirmed your order."
            : "Not placed yet. Every update here is one you report; Rusi doesn't track the restaurant or courier."}
        </p>
      </div>
      <OrderSummary session={session} />
      <OrderActions
        key={order.status + String(order.approved)}
        session={session}
        order={order}
        expectedFoodPaise={session.quotes.takeaway?.amountPaise}
        expectedCourierPaise={session.quotes.courier?.amountPaise}
      />
      <section aria-labelledby="timeline" className="flex flex-col gap-3">
        <SectionTitle><span id="timeline">Timeline</span></SectionTitle>
        <Card className="p-4">
          <AgentTimeline order={order} />
        </Card>
      </section>
      {open ? (
        <div className="flex flex-col gap-1">
          <Button variant="danger" onClick={() => dispatchOrder({ type: "CANCELLED" })}>Cancel this order help</Button>
          {placed ? <p className="text-center text-[14px] text-ink2">This doesn&apos;t cancel with the restaurant. Call them to cancel.</p> : null}
        </div>
      ) : null}
    </>
  );
}

export default function OrderStatusPage() {
  return (
    <Screen header={<AppHeader back="/order" backLabel="Back to call details" />}>
      <WithSession>{(s) => <Content session={s} />}</WithSession>
    </Screen>
  );
}
