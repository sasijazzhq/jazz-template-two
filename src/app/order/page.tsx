"use client";

import { useRouter } from "next/navigation";
import { CircleDot, Phone } from "lucide-react";
import { useState } from "react";
import { CallConsentSheet } from "@/components/agent/call-consent-sheet";
import { OrderSummary } from "@/components/comparison/order-summary";
import { SourceStatus } from "@/components/comparison/source-status";
import { AppHeader, PageTitle, Screen, SectionTitle, StickyCTA } from "@/components/layout/screen";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, FieldError, Notice } from "@/components/ui/feedback";
import { WithSession } from "@/components/ui/guards";
import { type ComparisonOption, buildOptions } from "@/features/comparison-engine/engine";
import { formatINR } from "@/features/comparison-engine/money";
import { useCapabilities, useNow } from "@/lib/hooks";
import { type Session, dispatchOrder, patchSession, useStore } from "@/lib/store";

const PHONE = /^\+?[0-9][0-9\s-]{6,16}$/;

function useChosen(session: Session | null): ComparisonOption | undefined {
  const now = useNow();
  if (!session) return undefined;
  return buildOptions(session.quotes, session.quantity, now).find((o) => o.id === session.selectedOptionId);
}

function CostCard({ option }: { option: ComparisonOption }) {
  return (
    <Card className="flex flex-col gap-2 p-3 text-[15px]">
      {option.parts.map((part) => (
        <div key={part.label} className="flex items-start justify-between gap-3">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            {part.label} <SourceStatus status={part.status} />
          </span>
          <span className="shrink-0 font-semibold tabular-nums">{formatINR(part.amountPaise)}</span>
        </div>
      ))}
      <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2 text-[17px] font-semibold">
        <span>Expected total</span>
        <span className="tabular-nums">{formatINR(option.totalPaise)}</span>
      </div>
      <p className="text-[14px] text-ink2">Not confirmed yet. The restaurant&apos;s price on the call is the one that counts.</p>
    </Card>
  );
}

function Content({ session, option }: { session: Session; option: ComparisonOption | undefined }) {
  const [phone, setPhone] = useState(session.restaurantPhone ?? "");
  if (!option) {
    return (
      <EmptyState title="Choose an option first">
        <p>Compare your prices and pick how you want to order.</p>
        <ButtonLink href="/results">See my options</ButtonLink>
      </EmptyState>
    );
  }
  if (option.id === "swiggy" || option.id === "zomato") {
    return (
      <>
        <PageTitle title={`Order in the ${option.label} app`}>Rusi can&apos;t place or pay for {option.label} orders. You finish this one in the app.</PageTitle>
        <OrderSummary session={session} />
        <CostCard option={option} />
        <Notice>Open {option.label} and check that the final amount still matches before you pay. App prices and offers change often.</Notice>
      </>
    );
  }
  const courier = option.id === "takeaway_courier";
  const steps = [
    `Confirm ${session.itemName} × ${session.quantity} is available`,
    "Confirm the final takeaway price, including packaging",
    "Ask how long it will take to prepare",
    ...(courier ? ["Ask whether a courier rider may collect the order"] : []),
  ];
  const phoneValid = PHONE.test(phone.trim());
  return (
    <>
      <PageTitle title="Call the restaurant">Confirm the price and timing with {session.restaurantName} before anything is ordered.</PageTitle>
      <OrderSummary session={session} />
      <CostCard option={option} />

      <section aria-labelledby="covers" className="flex flex-col gap-3">
        <SectionTitle><span id="covers">What the call covers</span></SectionTitle>
        <Card className="p-1">
          <ol className="flex flex-col">
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 border-b border-line px-3 py-3 text-[16px] leading-snug last:border-b-0">
                <span aria-hidden className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-tint text-[13px] font-bold text-green">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <Notice>
        A call does not place an order. You approve the item, quantity, price and restaurant before the order is placed
        {courier ? ", and booking a courier is a separate decision" : ""}. Nothing is paid through Rusi.
      </Notice>

      <section aria-labelledby="phone-title" className="flex flex-col gap-2">
        <SectionTitle><span id="phone-title">Restaurant phone</span></SectionTitle>
        <label htmlFor="phone" className="text-[15px] text-ink2">Rusi has no verified number for this branch. Add it if you have it (optional).</label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={phone}
          maxLength={18}
          placeholder="e.g. 044 1234 5678"
          aria-invalid={phone.trim() !== "" && !phoneValid ? true : undefined}
          onChange={(e) => {
            setPhone(e.target.value);
            patchSession({ restaurantPhone: PHONE.test(e.target.value.trim()) ? e.target.value.trim() : undefined });
          }}
          className="min-h-12 rounded-btn border border-line bg-card px-3 text-[17px] tabular-nums"
        />
        {phone.trim() !== "" && !phoneValid ? <FieldError>Enter a phone number using digits only.</FieldError> : null}
        {phoneValid ? (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-btn border border-primary bg-card px-4 text-[17px] font-semibold text-green active:opacity-75">
            <Phone aria-hidden size={20} /> Dial {phone.trim()}
          </a>
        ) : null}
      </section>
    </>
  );
}

export default function OrderPage() {
  const router = useRouter();
  const caps = useCapabilities();
  const { session } = useStore();
  const option = useChosen(session);
  const [consentOpen, setConsentOpen] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const order = session?.order;
  const viaRestaurant = option && (option.id === "takeaway_courier" || option.id === "self_pickup");
  const started = !!order && order.status !== "option_selected";

  const callMyself = () => {
    const failed =
      (order?.status === "option_selected" ? dispatchOrder({ type: "CONSENT_REQUESTED" }) : null) ??
      dispatchOrder({ type: "CALL_STARTED", mode: "manual", idempotencyKey: crypto.randomUUID() });
    if (failed) setError(failed);
    else router.push("/order/status");
  };

  const aiCall = async () => {
    if (!session || !session.restaurantPhone) {
      setCallError("Add the restaurant's phone number in international format first, for example +91 44 1234 5678.");
      return;
    }
    setBusy(true);
    setCallError(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          restaurantName: session.restaurantName,
          phoneE164: session.restaurantPhone.replace(/[^\d+]/g, ""),
          itemName: session.itemName,
          quantity: session.quantity,
          consentAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { message?: string };
        setCallError(`${json.message ?? "The call could not be started."} You can call the restaurant yourself instead.`);
        return;
      }
      if (order?.status === "option_selected") dispatchOrder({ type: "CONSENT_REQUESTED" });
      dispatchOrder({ type: "CALL_STARTED", mode: "agent", idempotencyKey });
      router.push("/order/status");
    } catch {
      setCallError("Network problem. The call was not started. You can call the restaurant yourself instead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<AppHeader back="/results" backLabel="Back to options" />}
      footer={
        session && option ? (
          <StickyCTA>
            {!viaRestaurant ? (
              <ButtonLink href="/results" variant="secondary">Back to my options</ButtonLink>
            ) : started ? (
              <ButtonLink href="/order/status">
                <CircleDot aria-hidden size={20} /> Continue to order status
              </ButtonLink>
            ) : (
              <>
                {caps.voiceCalls ? (
                  <Button onClick={() => setConsentOpen(true)}>
                    <Phone aria-hidden size={20} /> Let Rusi AI call now
                  </Button>
                ) : (
                  <p className="text-center text-[14px] text-ink2">Rusi AI calling isn&apos;t available in this build, so you make the call and Rusi guides you.</p>
                )}
                <Button variant={caps.voiceCalls ? "secondary" : "primary"} onClick={callMyself}>
                  <Phone aria-hidden size={20} /> Call restaurant myself
                </Button>
                {error ? <FieldError>{error}</FieldError> : null}
              </>
            )}
          </StickyCTA>
        ) : null
      }
    >
      <WithSession>{(s) => <Content session={s} option={option} />}</WithSession>
      {session ? (
        <CallConsentSheet open={consentOpen} onOpenChange={setConsentOpen} restaurantName={session.restaurantName} onConsent={aiCall} error={callError} busy={busy} />
      ) : null}
    </Screen>
  );
}
