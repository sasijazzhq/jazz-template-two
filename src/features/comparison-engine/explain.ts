import type { Comparison } from "./engine";
import { formatINR } from "./money";

/** Template-based, deterministic explanation. No LLM writes these numbers. */
export function explainRecommendation(c: Comparison): string {
  const r = c.recommended;
  const scope = c.allSourcesCompared ? "of the options you compared" : "among the options you compared";
  if (c.extraOverCheapestPaise > 0) {
    return `${r.label} costs ${formatINR(c.extraOverCheapestPaise)} more than ${c.cheapest.label}, but fits the preference you chose.`;
  }
  if (c.baseline && c.savingPaise > 0) {
    return `${r.label} is the lowest delivered price ${scope}: ${formatINR(c.savingPaise)} less than ${c.baseline.label}.`;
  }
  return `${r.label} is the best ${scope}. The prices are the same or too close to matter.`;
}

/** "Worth the extra?" — what paying more for the next option buys. */
export function worthTheExtra(c: Comparison): string | null {
  const next = c.pool.find((o) => o.id !== c.recommended.id && o.totalPaise > c.recommended.totalPaise);
  if (!next) return null;
  const extra = formatINR(next.totalPaise - c.recommended.totalPaise);
  if (c.recommended.id === "takeaway_courier") {
    return `${next.label} costs ${extra} more. It is one booking with in-app tracking and support. Takeaway + courier means calling the restaurant and booking the courier yourself, and the courier charge is an estimate until you get a real quote.`;
  }
  if (next.id === "takeaway_courier") {
    return `Takeaway + courier costs ${extra} more and takes two bookings, so it is not worth it here.`;
  }
  return `${next.label} costs ${extra} more for the same order. Pick it only if you prefer that app or it arrives sooner.`;
}
