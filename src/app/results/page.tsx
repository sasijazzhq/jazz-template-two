"use client";

import { useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";
import { useState } from "react";
import { OrderSummary } from "@/components/comparison/order-summary";
import { PreferenceSwitch } from "@/components/comparison/preference-switch";
import { ComparisonRow, PriceBreakdownSheet, RecommendationCard } from "@/components/comparison/results-parts";
import { AppHeader, PageTitle, Screen, SectionTitle, StickyCTA } from "@/components/layout/screen";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { WithSession } from "@/components/ui/guards";
import { type Comparison, compare } from "@/features/comparison-engine/engine";
import { explainRecommendation, worthTheExtra } from "@/features/comparison-engine/explain";
import { formatINR } from "@/features/comparison-engine/money";
import { createOrder } from "@/features/order-assistance/machine";
import { useNow } from "@/lib/hooks";
import { type Session, patchSession, useStore } from "@/lib/store";
import type { OptionId } from "@/types/domain";

function selectedId(session: Session, comparison: Comparison): OptionId {
  return comparison.options.some((o) => o.id === session.selectedOptionId) ? session.selectedOptionId! : comparison.recommended.id;
}

function Content({ session, comparison }: { session: Session; comparison: Comparison | null }) {
  const [sheet, setSheet] = useState(false);
  if (!comparison) {
    return (
      <EmptyState title="Not enough prices to compare">
        <p>Add at least two prices for the same order, then compare again.</p>
        <ButtonLink href="/compare">Add prices</ButtonLink>
      </EmptyState>
    );
  }
  const chosen = selectedId(session, comparison);
  const delivered = comparison.options.filter((o) => o.kind === "delivered").sort((a, b) => a.totalPaise - b.totalPaise);
  const pickups = comparison.options.filter((o) => o.kind === "pickup");
  const worth = worthTheExtra(comparison);
  const anyExpired = comparison.options.some((o) => o.status === "expired");
  const select = (id: OptionId) => patchSession({ selectedOptionId: id, order: undefined });

  return (
    <>
      <PageTitle title="Your options">
        {comparison.allSourcesCompared ? "All four prices compared." : `Comparing the ${comparison.options.length} options you added, not every way to order.`}
      </PageTitle>
      <OrderSummary session={session} />
      <PreferenceSwitch value={session.preference} onChange={(preference) => patchSession({ preference, selectedOptionId: undefined, order: undefined })} />
      {comparison.fallbackReason ? <Notice>{comparison.fallbackReason}</Notice> : null}
      <RecommendationCard comparison={comparison} />

      <section aria-labelledby="why" className="flex flex-col gap-2">
        <h2 id="why" className="text-[17px] font-semibold">Why this option</h2>
        <p className="text-[15px] leading-relaxed text-ink">{explainRecommendation(comparison)}</p>
        <p className="text-[13px] text-ink2">Worked out from your prices by fixed rules, not written by an AI model.</p>
        {worth ? (
          <details className="rounded-btn border border-line bg-card">
            <summary className="flex min-h-11 cursor-pointer items-center px-3 text-[15px] font-semibold text-green">Worth the extra?</summary>
            <p className="px-3 pb-3 text-[15px] leading-relaxed text-ink">{worth}</p>
          </details>
        ) : null}
      </section>

      {anyExpired ? <Notice tone="warn">Some prices were added over 30 minutes ago and may have changed. Check them again before ordering.</Notice> : null}

      <div role="radiogroup" aria-label="Choose how to order" className="flex flex-col gap-5">
        {delivered.length > 0 ? (
          <section aria-labelledby="delivered" className="flex flex-col gap-2">
            <SectionTitle><span id="delivered">Delivered to you</span></SectionTitle>
            {delivered.map((option) => (
              <ComparisonRow key={option.id} option={option} selected={chosen === option.id} recommended={comparison.recommended.id === option.id} onSelect={() => select(option.id)} />
            ))}
          </section>
        ) : null}
        {pickups.length > 0 ? (
          <section aria-labelledby="pickup" className="flex flex-col gap-2">
            <SectionTitle><span id="pickup">Collect it yourself</span></SectionTitle>
            {pickups.map((option) => (
              <ComparisonRow
                key={option.id}
                option={option}
                selected={chosen === option.id}
                recommended={comparison.recommended.id === option.id}
                onSelect={() => select(option.id)}
                note={
                  comparison.pickup && comparison.pickupSavingPaise > 0
                    ? `Saves ${formatINR(comparison.pickupSavingPaise)} against the dearest delivered option, plus your own trip.`
                    : undefined
                }
              />
            ))}
          </section>
        ) : null}
      </div>

      <Button variant="secondary" onClick={() => setSheet(true)}>
        <ReceiptText aria-hidden size={20} /> See price breakdown
      </Button>
      <PriceBreakdownSheet options={comparison.options} open={sheet} onOpenChange={setSheet} />
    </>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const now = useNow();
  const { session } = useStore();
  const comparison = session ? compare(session.quotes, session.quantity, session.preference, now) : null;
  return (
    <Screen
      header={<AppHeader back="/compare" backLabel="Back to prices" step={3} />}
      footer={
        session && comparison ? (
          <StickyCTA>
            <Button
              onClick={() => {
                const id = selectedId(session, comparison);
                const viaRestaurant = id === "takeaway_courier" || id === "self_pickup";
                patchSession({
                  selectedOptionId: id,
                  order: viaRestaurant ? (session.order ?? createOrder(id === "self_pickup" ? "pickup" : "courier")) : undefined,
                });
                router.push("/order");
              }}
            >
              Let Rusi help me order
            </Button>
          </StickyCTA>
        ) : null
      }
    >
      <WithSession>{(s) => <Content session={s} comparison={comparison} />}</WithSession>
    </Screen>
  );
}
