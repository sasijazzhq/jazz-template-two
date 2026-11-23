"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { OrderSummary } from "@/components/comparison/order-summary";
import { SourceCard } from "@/components/comparison/source-card";
import { AppHeader, PageTitle, Screen, SectionTitle, StickyCTA } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { DemoBadge, Notice } from "@/components/ui/feedback";
import { WithSession } from "@/components/ui/guards";
import { demoQuotes } from "@/features/comparison-engine/demo-data";
import { countAlternatives } from "@/features/comparison-engine/engine";
import { type Session, patchSession, useStore } from "@/lib/store";
import type { SourceId } from "@/types/domain";

const SOURCES: SourceId[] = ["swiggy", "zomato", "takeaway", "courier"];

function Content({ session }: { session: Session }) {
  const [demoKey, setDemoKey] = useState(0);
  return (
    <>
      <PageTitle title="Compare prices">Add the final amount from each option you want to compare.</PageTitle>
      <OrderSummary
        session={session}
        action={
          <Link href="/restaurants" className="inline-flex min-h-11 items-center gap-1.5 rounded-btn bg-tint px-3 text-[15px] font-semibold text-green active:opacity-70">
            <Pencil aria-hidden size={16} /> Edit
          </Link>
        }
      />
      <section aria-labelledby="prices" className="flex flex-col gap-3">
        <SectionTitle><span id="prices">Add price details</span></SectionTitle>
        <Notice>Use the final amount you would pay, including taxes, delivery, packaging and discounts. A menu price is not a checkout total.</Notice>
        {SOURCES.map((source) => (
          <SourceCard
            key={`${source}-${demoKey}`}
            source={source}
            quote={session.quotes[source]}
            quantity={session.quantity}
            onQuote={(quote) => {
              const quotes = { ...session.quotes };
              if (quote) quotes[source] = quote;
              else delete quotes[source];
              patchSession({ quotes, compared: false, selectedOptionId: undefined, order: undefined });
            }}
          />
        ))}
        <Button
          variant="ghost"
          onClick={() => {
            patchSession({ quotes: demoQuotes(new Date().toISOString(), session.quantity), compared: false, selectedOptionId: undefined, order: undefined });
            setDemoKey((k) => k + 1);
          }}
        >
          Fill with sample prices <DemoBadge />
        </Button>
      </section>
    </>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const { session } = useStore();
  const count = session ? countAlternatives(session.quotes, session.quantity) : 0;
  const needsReview = session ? Object.values(session.quotes).some((q) => q?.status === "ai_extracted_review") : false;
  const ready = count >= 2 && !needsReview;
  return (
    <Screen
      header={<AppHeader back="/restaurants" backLabel="Back to branch selection" step={2} />}
      footer={
        session ? (
          <StickyCTA
            hint={
              needsReview
                ? "Confirm or correct the amounts read from your screenshots."
                : ready
                  ? "You can compare with just two prices."
                  : "Add at least two prices to compare."
            }
          >
            <Button
              disabled={!ready}
              onClick={() => {
                patchSession({ compared: true });
                router.push("/results");
              }}
            >
              Compare my options
            </Button>
          </StickyCTA>
        ) : null
      }
    >
      <WithSession>{(s) => <Content session={s} />}</WithSession>
    </Screen>
  );
}
