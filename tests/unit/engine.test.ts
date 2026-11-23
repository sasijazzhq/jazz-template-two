import { describe, expect, it } from "vitest";
import { demoQuotes } from "@/features/comparison-engine/demo-data";
import { QUOTE_TTL_MS, buildOptions, compare, countAlternatives } from "@/features/comparison-engine/engine";
import { explainRecommendation, worthTheExtra } from "@/features/comparison-engine/explain";
import type { QuoteMap } from "@/types/domain";

const AT = "2026-11-23T10:00:00.000Z";
const NOW = Date.parse(AT) + 60_000;
const demo = () => demoQuotes(AT, 1);

describe("comparison engine", () => {
  it("reproduces the demo figures", () => {
    const c = compare(demo(), 1, "cheapest", NOW)!;
    expect(c.recommended.id).toBe("takeaway_courier");
    expect(c.recommended.totalPaise).toBe(33500);
    expect(c.baseline?.id).toBe("swiggy");
    expect(c.savingPaise).toBe(8800);
    expect(c.savingPercentTenths).toBe(208);
    expect(c.allSourcesCompared).toBe(true);
    expect(c.recommended.status).toBe("estimated");
  });

  it("keeps self-pickup out of the delivered ranking", () => {
    const c = compare(demo(), 1, "cheapest", NOW)!;
    expect(c.pool.map((o) => o.id)).toEqual(["takeaway_courier", "zomato", "swiggy"]);
    expect(c.pickup?.totalPaise).toBe(28000);
    expect(c.pickupSavingPaise).toBe(14300);
  });

  it("works with two alternatives and says so", () => {
    const { swiggy, zomato } = demo();
    const c = compare({ swiggy, zomato }, 1, "cheapest", NOW)!;
    expect(c.recommended.id).toBe("zomato");
    expect(c.savingPaise).toBe(2800);
    expect(c.allSourcesCompared).toBe(false);
    expect(explainRecommendation(c)).toContain("among the options you compared");
  });

  it("needs at least two comparable alternatives", () => {
    const { swiggy, courier } = demo();
    expect(compare({ swiggy }, 1, "cheapest", NOW)).toBeNull();
    expect(compare({ swiggy, courier }, 1, "cheapest", NOW)).toBeNull(); // courier alone is not an option
    expect(countAlternatives({ swiggy, courier }, 1)).toBe(1);
  });

  it("ignores quotes for a different quantity", () => {
    const quotes = demo();
    quotes.swiggy = { ...quotes.swiggy!, quantity: 2 };
    expect(buildOptions(quotes, 1, NOW).some((o) => o.id === "swiggy")).toBe(false);
  });

  it("only ranks by time when every option has an ETA", () => {
    const quotes = demo();
    const noEta = compare(quotes, 1, "fastest", NOW)!;
    expect(noEta.recommended.id).toBe("takeaway_courier");
    expect(noEta.fallbackReason).toBeTruthy();

    const timed: QuoteMap = {
      swiggy: { ...quotes.swiggy!, etaMinutes: 25 },
      zomato: { ...quotes.zomato!, etaMinutes: 40 },
      takeaway: { ...quotes.takeaway!, etaMinutes: 20 },
      courier: { ...quotes.courier!, etaMinutes: 25 },
    };
    const fastest = compare(timed, 1, "fastest", NOW)!;
    expect(fastest.recommended.id).toBe("swiggy");
    expect(fastest.fallbackReason).toBeUndefined();
    expect(fastest.extraOverCheapestPaise).toBe(8800);
    expect(explainRecommendation(fastest)).toContain("₹88 more");
  });

  it("balances price and time with a transparent per-minute value", () => {
    const quotes = demo();
    const timed: QuoteMap = {
      swiggy: { ...quotes.swiggy!, etaMinutes: 20 },
      zomato: { ...quotes.zomato!, etaMinutes: 25 },
      takeaway: { ...quotes.takeaway!, etaMinutes: 30 },
      courier: { ...quotes.courier!, etaMinutes: 30 },
    };
    // ₹2/min: takeaway+courier 335+120=455, zomato 395+50=445, swiggy 423+40=463
    expect(compare(timed, 1, "balance", NOW)!.recommended.id).toBe("zomato");
    // ₹0/min collapses to cheapest
    expect(compare(timed, 1, "balance", NOW, { minuteValuePaise: 0 })!.recommended.id).toBe("takeaway_courier");
  });

  it("flags old prices as expired without changing the maths", () => {
    const c = compare(demo(), 1, "cheapest", NOW + QUOTE_TTL_MS + 1)!;
    expect(c.options.every((o) => o.status === "expired")).toBe(true);
    expect(c.savingPaise).toBe(8800);
  });

  it("explains what paying more buys", () => {
    expect(worthTheExtra(compare(demo(), 1, "cheapest", NOW)!)).toContain("Zomato costs ₹60 more");
  });
});
