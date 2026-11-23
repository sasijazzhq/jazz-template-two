import { z } from "zod";
import type { PriceBreakdown, SourceId } from "@/types/domain";
import { parseRupeesToPaise } from "@/features/comparison-engine/money";

/**
 * What the vision model is asked to return. Amounts are copied as printed
 * (strings); all parsing and arithmetic happens here, deterministically.
 */
const amount = z.string().max(20).nullable();
export const rawExtractionSchema = z.object({
  is_checkout_screen: z.boolean(),
  platform: z.enum(["swiggy", "zomato", "unknown"]),
  currency: z.string().max(8),
  quantity: z.number().int().min(1).max(99).nullable(),
  item_subtotal: amount,
  taxes: amount,
  packaging_charge: amount,
  platform_fee: amount,
  delivery_fee: amount,
  discount: amount,
  final_payable: amount,
  eta_minutes: z.number().int().min(1).max(600).nullable(),
  confidence: z.number().min(0).max(1),
});
export type RawExtraction = z.infer<typeof rawExtractionSchema>;

export interface Extraction {
  finalPayablePaise: number;
  breakdown: PriceBreakdown;
  quantity?: number;
  etaMinutes?: number;
  confidence: number;
  /** Human-readable reasons the user must double-check this result. */
  warnings: string[];
}

export type NormalizeResult = { ok: true; extraction: Extraction } | { ok: false; message: string };

export const LOW_CONFIDENCE = 0.7;

export function normalizeExtraction(
  raw: RawExtraction,
  expected: { source: Extract<SourceId, "swiggy" | "zomato">; quantity: number },
): NormalizeResult {
  if (!raw.is_checkout_screen) {
    return { ok: false, message: "This doesn't look like a checkout screen. Upload the bill summary with the final amount." };
  }
  if (!/^(inr|₹|rs\.?)$/i.test(raw.currency.trim())) {
    return { ok: false, message: "The amounts are not in Indian rupees." };
  }
  const paise = (v: string | null) => (v === null ? undefined : parseRupeesToPaise(v) ?? undefined);
  const finalPayablePaise = paise(raw.final_payable);
  if (finalPayablePaise === undefined || finalPayablePaise <= 0) {
    return { ok: false, message: "Couldn't find the final payable amount. Enter it yourself." };
  }

  const breakdown: PriceBreakdown = {
    itemSubtotalPaise: paise(raw.item_subtotal),
    taxesPaise: paise(raw.taxes),
    packagingPaise: paise(raw.packaging_charge),
    platformFeePaise: paise(raw.platform_fee),
    deliveryFeePaise: paise(raw.delivery_fee),
    discountPaise: paise(raw.discount),
  };

  const warnings: string[] = [];
  if (raw.platform !== "unknown" && raw.platform !== expected.source) {
    warnings.push(`This looks like a ${raw.platform === "swiggy" ? "Swiggy" : "Zomato"} screenshot.`);
  }
  if (raw.quantity !== null && raw.quantity !== expected.quantity) {
    warnings.push(`The screenshot shows quantity ${raw.quantity}, but you are comparing ${expected.quantity}.`);
  }
  if (raw.confidence < LOW_CONFIDENCE) warnings.push("Parts of the screenshot were hard to read.");
  if (breakdown.itemSubtotalPaise !== undefined) {
    const sum =
      breakdown.itemSubtotalPaise +
      (breakdown.taxesPaise ?? 0) +
      (breakdown.packagingPaise ?? 0) +
      (breakdown.platformFeePaise ?? 0) +
      (breakdown.deliveryFeePaise ?? 0) -
      (breakdown.discountPaise ?? 0);
    // Allow ₹1 for rounding lines that apps do not always print.
    if (Math.abs(sum - finalPayablePaise) > 100) {
      warnings.push("The fees read from the screenshot don't add up to the final amount.");
    }
  }

  return {
    ok: true,
    extraction: {
      finalPayablePaise,
      breakdown,
      quantity: raw.quantity ?? undefined,
      etaMinutes: raw.eta_minutes ?? undefined,
      confidence: raw.confidence,
      warnings,
    },
  };
}

export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
export const SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"];
