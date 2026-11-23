import type { QuoteMap } from "@/types/domain";

/** ILLUSTRATIVE DEMO DATA ONLY — not live prices from any service. */
export const DEMO_QUERY = "Chicken Biryani from SS Hyderabad Biryani";
export const DEMO_ITEM = "Chicken Biryani";
export const DEMO_RESTAURANT = "SS Hyderabad Biryani";

export function demoQuotes(capturedAt: string, quantity: number): QuoteMap {
  return {
    swiggy: { source: "swiggy", amountPaise: 42300, status: "user_entered", capturedAt, quantity, demo: true },
    zomato: { source: "zomato", amountPaise: 39500, status: "user_entered", capturedAt, quantity, demo: true },
    takeaway: { source: "takeaway", amountPaise: 28000, status: "user_entered", capturedAt, quantity, demo: true },
    courier: { source: "courier", amountPaise: 5500, status: "estimated", capturedAt, quantity, demo: true },
  };
}
