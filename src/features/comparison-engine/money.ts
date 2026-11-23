import type { Paise } from "@/types/domain";

/**
 * Parse a rupee amount as typed or printed ("₹1,234.50", "423", "Rs. 55")
 * into integer paise. Returns null for anything that is not a plain,
 * non-negative amount with at most two decimals. No floating point maths.
 */
export function parseRupeesToPaise(input: string): Paise | null {
  const cleaned = input
    .replace(/₹|rs\.?|inr/gi, "")
    .replace(/[,\s]/g, "")
    .trim();
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  const rupees = Number.parseInt(match[1]!, 10);
  const fraction = (match[2] ?? "").padEnd(2, "0");
  const paise = fraction === "" ? 0 : Number.parseInt(fraction, 10);
  return rupees * 100 + paise;
}

const rupeeGrouping = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** Format paise as Indian rupees: 33500 → "₹335", 28050 → "₹280.50". */
export function formatINR(paise: Paise): string {
  const sign = paise < 0 ? "−" : "";
  const abs = Math.abs(Math.trunc(paise));
  const rupees = Math.trunc(abs / 100);
  const rest = abs % 100;
  const whole = rupeeGrouping.format(rupees);
  return rest === 0 ? `${sign}₹${whole}` : `${sign}₹${whole}.${String(rest).padStart(2, "0")}`;
}

/** Plain digits for an <input>: 28000 → "280", 28050 → "280.50". */
export function paiseToInput(paise: Paise): string {
  const rupees = Math.trunc(paise / 100);
  const rest = paise % 100;
  return rest === 0 ? String(rupees) : `${rupees}.${String(rest).padStart(2, "0")}`;
}

/**
 * Rounding policy for percentages: one decimal place, round half up,
 * computed with integers. Returns tenths of a percent (208 = 20.8%).
 */
export function percentTenths(part: Paise, whole: Paise): number {
  if (whole <= 0 || part <= 0) return 0;
  return Math.floor((part * 2000 + whole) / (whole * 2));
}

export function formatPercentTenths(tenths: number): string {
  return `${Math.trunc(tenths / 10)}.${tenths % 10}%`;
}
