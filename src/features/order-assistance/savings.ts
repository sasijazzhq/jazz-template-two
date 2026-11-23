import { compare } from "@/features/comparison-engine/engine";
import type { Session } from "@/lib/store";
import { isOrderPlaced } from "./machine";

export interface SavingEntry {
  session: Session;
  savingPaise: number;
  baselineLabel: string;
}

/**
 * Confirmed savings come only from orders the user reported as placed, using
 * the price confirmed on the call. Everything else is potential.
 */
export function summariseSavings(sessions: Session[]): { confirmed: SavingEntry[]; potential: SavingEntry[] } {
  const confirmed: SavingEntry[] = [];
  const potential: SavingEntry[] = [];
  for (const session of sessions) {
    if (!session.compared) continue;
    const comparison = compare(session.quotes, session.quantity, "cheapest", 0);
    if (!comparison) continue;
    const dearest = comparison.pool.at(-1)!;
    const order = session.order;
    if (order && isOrderPlaced(order) && order.status !== "cancelled" && order.confirmedPricePaise !== undefined) {
      const courierKnown = order.mode === "pickup" || order.courierQuotePaise !== undefined;
      if (courierKnown) {
        const paid = order.confirmedPricePaise + (order.courierQuotePaise ?? 0);
        confirmed.push({ session, savingPaise: Math.max(0, dearest.totalPaise - paid), baselineLabel: dearest.label });
        continue;
      }
    }
    if (comparison.savingPaise > 0) potential.push({ session, savingPaise: comparison.savingPaise, baselineLabel: dearest.label });
  }
  return { confirmed, potential };
}
