"use client";

import { PiggyBank } from "lucide-react";
import { AppHeader, PageTitle, Screen, SectionTitle, TabBar } from "@/components/layout/screen";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, Spinner } from "@/components/ui/feedback";
import { formatINR } from "@/features/comparison-engine/money";
import { type SavingEntry, summariseSavings } from "@/features/order-assistance/savings";
import { formatDay } from "@/lib/hooks";
import { useHydrated, useStore } from "@/lib/store";

function Group({ id, title, note, entries, empty }: { id: string; title: string; note: string; entries: SavingEntry[]; empty: string }) {
  const total = entries.reduce((sum, e) => sum + e.savingPaise, 0);
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <SectionTitle><span id={id}>{title}</span></SectionTitle>
      <Card className="p-4">
        <p className="text-[34px] font-bold leading-none tabular-nums text-green">{formatINR(total)}</p>
        <p className="mt-1 text-[14px] text-ink2">{note}</p>
        {entries.length === 0 ? (
          <p className="mt-3 text-[15px] text-ink2">{empty}</p>
        ) : (
          <ul className="mt-3 flex flex-col">
            {entries.map((e) => (
              <li key={e.session.id} className="flex items-start justify-between gap-3 border-t border-line py-2.5 text-[15px]">
                <span className="min-w-0">
                  <span className="block break-words font-medium">{e.session.itemName} × {e.session.quantity}</span>
                  <span className="block break-words text-[14px] text-ink2">{e.session.restaurantName} · {formatDay(e.session.createdAt)} · vs {e.baselineLabel}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatINR(e.savingPaise)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

export default function SavingsPage() {
  const hydrated = useHydrated();
  const { session, history } = useStore();
  const { confirmed, potential } = summariseSavings(session ? [session, ...history] : history);
  return (
    <Screen header={<AppHeader />} footer={<TabBar />}>
      <PageTitle title="Savings">Based only on prices you entered and orders you reported.</PageTitle>
      {!hydrated ? (
        <Spinner label="Loading savings…" />
      ) : confirmed.length + potential.length === 0 ? (
        <EmptyState icon={<PiggyBank aria-hidden size={24} />} title="No savings yet">
          <p>Compare a meal to see what you could save. Savings count as confirmed only after you report an order as placed.</p>
          <ButtonLink href="/">Compare a meal</ButtonLink>
        </EmptyState>
      ) : (
        <>
          <Group id="confirmed" title="Confirmed" note="Orders you reported as placed, at the price confirmed on the call." entries={confirmed} empty="No confirmed orders yet." />
          <Group id="potential" title="Potential" note="From comparisons you didn't order through Rusi. Not money actually saved." entries={potential} empty="No open comparisons." />
        </>
      )}
    </Screen>
  );
}
