import { describe, expect, it } from "vitest";
import { formatINR, formatPercentTenths, paiseToInput, parseRupeesToPaise, percentTenths } from "@/features/comparison-engine/money";

describe("parseRupeesToPaise", () => {
  it("parses printed rupee amounts into integer paise", () => {
    expect(parseRupeesToPaise("423")).toBe(42300);
    expect(parseRupeesToPaise("₹1,234.50")).toBe(123450);
    expect(parseRupeesToPaise("Rs. 55")).toBe(5500);
    expect(parseRupeesToPaise("280.5")).toBe(28050);
    expect(parseRupeesToPaise(" 0.07 ")).toBe(7);
  });
  it("rejects anything that is not a plain amount", () => {
    for (const bad of ["", "abc", "-5", "1.234", "12.3.4", "1e3", "₹"]) expect(parseRupeesToPaise(bad)).toBeNull();
  });
});

describe("formatting", () => {
  it("formats paise as rupees with Indian grouping", () => {
    expect(formatINR(33500)).toBe("₹335");
    expect(formatINR(28050)).toBe("₹280.50");
    expect(formatINR(12345600)).toBe("₹1,23,456");
    expect(formatINR(-5500)).toBe("−₹55");
  });
  it("round-trips input text", () => {
    expect(paiseToInput(28000)).toBe("280");
    expect(parseRupeesToPaise(paiseToInput(28050))).toBe(28050);
  });
  it("rounds percentages half up to one decimal using integers", () => {
    expect(percentTenths(8800, 42300)).toBe(208); // 20.80…%
    expect(formatPercentTenths(208)).toBe("20.8%");
    expect(percentTenths(1, 2000)).toBe(1); // 0.05% → 0.1%
    expect(percentTenths(5000, 10000)).toBe(500);
    expect(percentTenths(0, 100)).toBe(0);
    expect(percentTenths(10, 0)).toBe(0);
  });
});
