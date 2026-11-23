import { describe, expect, it } from "vitest";
import { type RawExtraction, normalizeExtraction, rawExtractionSchema } from "@/features/price-extraction/schema";
import { parseQuery } from "@/features/restaurant-discovery/parse-query";
import { demoRestaurantProvider } from "@/features/restaurant-discovery/provider";

const raw: RawExtraction = {
  is_checkout_screen: true,
  platform: "swiggy",
  currency: "INR",
  quantity: 1,
  item_subtotal: "₹349.00",
  taxes: "17.45",
  packaging_charge: "20",
  platform_fee: "10.55",
  delivery_fee: "46",
  discount: "20",
  final_payable: "₹423",
  eta_minutes: 32,
  confidence: 0.93,
};
const expected = { source: "swiggy", quantity: 1 } as const;

describe("screenshot extraction normalisation", () => {
  it("turns printed strings into paise without warnings when consistent", () => {
    const r = normalizeExtraction(raw, expected);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.extraction.finalPayablePaise).toBe(42300);
    expect(r.extraction.breakdown).toEqual({
      itemSubtotalPaise: 34900, taxesPaise: 1745, packagingPaise: 2000, platformFeePaise: 1055, deliveryFeePaise: 4600, discountPaise: 2000,
    });
    expect(r.extraction.warnings).toEqual([]);
  });

  it("does not treat an item price as the checkout total", () => {
    const r = normalizeExtraction({ ...raw, final_payable: null }, expected);
    expect(r.ok).toBe(false);
  });

  it("flags mismatches for user review", () => {
    const r = normalizeExtraction({ ...raw, platform: "zomato", quantity: 2, confidence: 0.4, final_payable: "500" }, expected);
    expect(r.ok && r.extraction.warnings).toHaveLength(4);
  });

  it("rejects non-checkout screens and other currencies", () => {
    expect(normalizeExtraction({ ...raw, is_checkout_screen: false }, expected).ok).toBe(false);
    expect(normalizeExtraction({ ...raw, currency: "USD" }, expected).ok).toBe(false);
  });

  it("validates model output shape", () => {
    expect(rawExtractionSchema.safeParse(raw).success).toBe(true);
    expect(rawExtractionSchema.safeParse({ ...raw, final_payable: 423 }).success).toBe(false);
    expect(rawExtractionSchema.safeParse({ ...raw, confidence: 3 }).success).toBe(false);
  });
});

describe("parseQuery", () => {
  it("splits dish, restaurant and quantity", () => {
    expect(parseQuery("Chicken Biryani from SS Hyderabad Biryani")).toEqual({ itemName: "Chicken Biryani", restaurantName: "SS Hyderabad Biryani", quantity: 1 });
    expect(parseQuery("2 masala dosa at A2B")).toEqual({ itemName: "masala dosa", restaurantName: "A2B", quantity: 2 });
    expect(parseQuery("Paneer pizza x3")).toEqual({ itemName: "Paneer pizza", restaurantName: undefined, quantity: 3 });
    expect(parseQuery("   ")).toBeNull();
  });
});

describe("demo restaurant provider", () => {
  it("returns labelled sample branches without addresses or distances", async () => {
    const r = await demoRestaurantProvider.searchBranches("SS Hyderabad Biryani", null);
    expect(r.kind).toBe("found");
    if (r.kind !== "found") return;
    expect(r.demo).toBe(true);
    expect(r.branches.every((b) => b.source === "demo" && b.address === undefined && b.distanceMeters === undefined)).toBe(true);
  });
  it("never invents branches for other restaurants", async () => {
    expect((await demoRestaurantProvider.searchBranches("A2B", null)).kind).toBe("no_provider");
  });
});
