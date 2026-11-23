import type { OptionId, Paise, Preference, PriceQuote, QuoteMap, SourceStatus } from "@/types/domain";
import { percentTenths } from "./money";

/** Prices older than this are flagged "Expired" — app prices change quickly. */
export const QUOTE_TTL_MS = 30 * 60 * 1000;

export interface BalanceSettings {
  /** What one minute of waiting is worth to the user, in paise. */
  minuteValuePaise: Paise;
}
export const DEFAULT_BALANCE: BalanceSettings = { minuteValuePaise: 200 };

export interface OptionPart {
  label: string;
  amountPaise: Paise;
  quote: PriceQuote;
  status: SourceStatus;
}

export interface ComparisonOption {
  id: OptionId;
  label: string;
  detail: string;
  /** Delivered to the door vs. the user collecting it themselves. */
  kind: "delivered" | "pickup";
  totalPaise: Paise;
  parts: OptionPart[];
  /** The least trustworthy status among the parts. */
  status: SourceStatus;
  etaMinutes?: number;
  demo: boolean;
}

export interface Comparison {
  options: ComparisonOption[];
  /** Options the recommendation is chosen from (delivered when any exist). */
  pool: ComparisonOption[];
  recommended: ComparisonOption;
  cheapest: ComparisonOption;
  /** Most expensive other option in the pool; savings are measured against it. */
  baseline?: ComparisonOption;
  savingPaise: Paise;
  savingPercentTenths: number;
  /** How much more the recommendation costs than the cheapest pool option. */
  extraOverCheapestPaise: Paise;
  pickup?: ComparisonOption;
  pickupSavingPaise: Paise;
  /** Set when the requested preference could not be honoured. */
  fallbackReason?: string;
  /** True only when Swiggy, Zomato, takeaway and courier were all compared. */
  allSourcesCompared: boolean;
}

const STATUS_RANK: SourceStatus[] = [
  "verified_checkout",
  "user_entered",
  "ai_extracted_review",
  "estimated",
  "expired",
  "unavailable",
];

export function effectiveStatus(quote: PriceQuote, nowMs: number): SourceStatus {
  if (nowMs > 0 && nowMs - Date.parse(quote.capturedAt) > QUOTE_TTL_MS) return "expired";
  return quote.status;
}

function weakest(statuses: SourceStatus[]): SourceStatus {
  return statuses.reduce((a, b) => (STATUS_RANK.indexOf(b) > STATUS_RANK.indexOf(a) ? b : a));
}

function usable(quote: PriceQuote | undefined, quantity: number): quote is PriceQuote {
  return (
    !!quote &&
    quote.status !== "unavailable" &&
    Number.isInteger(quote.amountPaise) &&
    quote.amountPaise > 0 &&
    // Only equivalent quantities are comparable. Courier is per trip.
    (quote.source === "courier" || quote.quantity === quantity)
  );
}

/** Build every alternative that the collected quotes support. */
export function buildOptions(quotes: QuoteMap, quantity: number, nowMs: number): ComparisonOption[] {
  const options: ComparisonOption[] = [];
  const part = (label: string, quote: PriceQuote): OptionPart => ({
    label,
    amountPaise: quote.amountPaise,
    quote,
    status: effectiveStatus(quote, nowMs),
  });

  for (const [id, label] of [["swiggy", "Swiggy"], ["zomato", "Zomato"]] as const) {
    const quote = quotes[id];
    if (!usable(quote, quantity)) continue;
    const p = part(`${label} final payable`, quote);
    options.push({
      id,
      label,
      detail: "App delivery",
      kind: "delivered",
      totalPaise: quote.amountPaise,
      parts: [p],
      status: p.status,
      etaMinutes: quote.etaMinutes,
      demo: !!quote.demo,
    });
  }

  const takeaway = quotes.takeaway;
  const courier = quotes.courier;
  if (usable(takeaway, quantity)) {
    const food = part("Restaurant takeaway price", takeaway);
    if (usable(courier, quantity)) {
      const ride = part("Courier charge", courier);
      options.push({
        id: "takeaway_courier",
        label: "Takeaway + courier",
        detail: "You order direct, a courier delivers",
        kind: "delivered",
        totalPaise: takeaway.amountPaise + courier.amountPaise,
        parts: [food, ride],
        status: weakest([food.status, ride.status]),
        etaMinutes:
          takeaway.etaMinutes !== undefined && courier.etaMinutes !== undefined
            ? takeaway.etaMinutes + courier.etaMinutes
            : undefined,
        demo: !!takeaway.demo || !!courier.demo,
      });
    }
    options.push({
      id: "self_pickup",
      label: "Self-pickup",
      detail: "You collect it from the restaurant",
      kind: "pickup",
      totalPaise: takeaway.amountPaise,
      parts: [food],
      status: food.status,
      demo: !!takeaway.demo,
    });
  }
  return options;
}

const byTotal = (a: ComparisonOption, b: ComparisonOption) => a.totalPaise - b.totalPaise;

/**
 * Deterministic comparison. Needs at least two comparable alternatives.
 * Self-pickup is never mixed into the delivered ranking: it costs the user
 * a trip, so it is reported separately.
 */
export function compare(
  quotes: QuoteMap,
  quantity: number,
  preference: Preference,
  nowMs: number,
  balance: BalanceSettings = DEFAULT_BALANCE,
): Comparison | null {
  const options = buildOptions(quotes, quantity, nowMs);
  if (options.length < 2) return null;

  const delivered = options.filter((o) => o.kind === "delivered");
  const pool = (delivered.length > 0 ? delivered : options).slice().sort(byTotal);
  const cheapest = pool[0]!;
  const allHaveEta = pool.length > 1 && pool.every((o) => o.etaMinutes !== undefined);

  let recommended = cheapest;
  let fallbackReason: string | undefined;
  if (preference === "fastest") {
    if (allHaveEta) {
      recommended = pool.slice().sort((a, b) => a.etaMinutes! - b.etaMinutes! || byTotal(a, b))[0]!;
    } else {
      fallbackReason = "Add a delivery time for each option to compare speed. Showing the lowest price instead.";
    }
  } else if (preference === "balance") {
    if (allHaveEta) {
      const score = (o: ComparisonOption) => o.totalPaise + o.etaMinutes! * balance.minuteValuePaise;
      recommended = pool.slice().sort((a, b) => score(a) - score(b) || byTotal(a, b))[0]!;
    } else {
      fallbackReason = "Without delivery times, the best balance is the lowest price.";
    }
  }

  const others = pool.filter((o) => o.id !== recommended.id);
  const baseline = others.length > 0 ? others[others.length - 1] : undefined;
  const savingPaise = baseline ? Math.max(0, baseline.totalPaise - recommended.totalPaise) : 0;

  const pickup = delivered.length > 0 ? options.find((o) => o.kind === "pickup") : undefined;
  const dearestDelivered = delivered.slice().sort(byTotal).at(-1);
  const pickupSavingPaise =
    pickup && dearestDelivered ? Math.max(0, dearestDelivered.totalPaise - pickup.totalPaise) : 0;

  return {
    options,
    pool,
    recommended,
    cheapest,
    baseline,
    savingPaise,
    savingPercentTenths: baseline ? percentTenths(savingPaise, baseline.totalPaise) : 0,
    extraOverCheapestPaise: recommended.totalPaise - cheapest.totalPaise,
    pickup,
    pickupSavingPaise,
    fallbackReason,
    allSourcesCompared: (["swiggy", "zomato", "takeaway", "courier"] as const).every((s) =>
      usable(quotes[s], quantity),
    ),
  };
}

/** Number of comparable alternatives the current quotes support. */
export function countAlternatives(quotes: QuoteMap, quantity: number): number {
  return buildOptions(quotes, quantity, 0).length;
}
