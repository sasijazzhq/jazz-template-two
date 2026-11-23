"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, History } from "lucide-react";
import { useState } from "react";
import { AppHeader, PageTitle, Screen, TabBar } from "@/components/layout/screen";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, Spinner } from "@/components/ui/feedback";
import { isOrderPlaced } from "@/features/order-assistance/machine";
import { formatDay } from "@/lib/hooks";
import { type Session, clearAllData, resumeSession, routeForSession, useHydrated, useStore } from "@/lib/store";

function statusLabel(s: Session): string {
  const o = s.order;
  if (o?.status === "complete") return "Completed";
  if (o?.status === "cancelled") return "Cancelled";
  if (o?.status === "declined") return "Declined";
  if (o && isOrderPlaced(o)) return "Order placed";
  if (o && o.status !== "option_selected") return "Order help in progress";
  if (s.compared) return "Compared";
  return "Draft";
}

export default function HistoryPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { session, history } = useStore();
  const [confirming, setConfirming] = useState(false);
  const all = session ? [session, ...history] : history;
  return (
    <Screen header={<AppHeader />} footer={<TabBar />}>
      <PageTitle title="History">Saved only on this device.</PageTitle>
      {!hydrated ? (
        <Spinner label="Loading history…" />
      ) : all.length === 0 ? (
        <EmptyState icon={<History aria-hidden size={24} />} title="Nothing here yet">
          <p>Your comparisons will appear here.</p>
          <ButtonLink href="/">Start a search</ButtonLink>
        </EmptyState>
      ) : (
        <>
          <Card className="overflow-hidden">
            <ul>
              {all.map((s) => (
                <li key={s.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id !== session?.id) resumeSession(s.id);
                      router.push(routeForSession(s));
                    }}
                    className="flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-fill"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-[16px] font-semibold">{s.itemName} × {s.quantity}</span>
                      <span className="block break-words text-[14px] text-ink2">{s.restaurantName || "No restaurant"} · {formatDay(s.createdAt)}</span>
                      <span className="block text-[14px] text-ink2">{statusLabel(s)}</span>
                    </span>
                    <ChevronRight aria-hidden size={20} className="shrink-0 text-ink2" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          {confirming ? (
            <Card className="flex flex-col gap-2 p-4">
              <p className="text-[16px] font-semibold">Delete all history on this device?</p>
              <p className="text-[15px] text-ink2">This can&apos;t be undone.</p>
              <Button variant="danger" onClick={() => { clearAllData(); setConfirming(false); }}>Delete everything</Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>Keep my history</Button>
            </Card>
          ) : (
            <Button variant="ghost" className="text-danger" onClick={() => setConfirming(true)}>Delete all history</Button>
          )}
        </>
      )}
    </Screen>
  );
}
