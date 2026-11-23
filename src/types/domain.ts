/** Shared domain types. All money is integer paise (₹1 = 100 paise). */
export type Paise = number;

export type SourceId = "swiggy" | "zomato" | "takeaway" | "courier";

export type SourceStatus =
  | "verified_checkout"
  | "user_entered"
  | "ai_extracted_review"
  | "estimated"
  | "expired"
  | "unavailable";

export interface PriceBreakdown {
  itemSubtotalPaise?: Paise;
  taxesPaise?: Paise;
  packagingPaise?: Paise;
  platformFeePaise?: Paise;
  deliveryFeePaise?: Paise;
  discountPaise?: Paise;
}

export interface PriceQuote {
  source: SourceId;
  /** Final payable amount for this source (for courier: the delivery charge). */
  amountPaise: Paise;
  status: SourceStatus;
  /** ISO timestamp of when the user captured or entered this price. */
  capturedAt: string;
  quantity: number;
  etaMinutes?: number;
  breakdown?: PriceBreakdown;
  confidence?: number;
  /** True when the value came from the built-in illustrative demo data. */
  demo?: boolean;
}

export type QuoteMap = Partial<Record<SourceId, PriceQuote>>;

export type OptionId = "swiggy" | "zomato" | "takeaway_courier" | "self_pickup";
export type Preference = "cheapest" | "fastest" | "balance";

export interface Branch {
  id: string;
  name: string;
  area: string;
  /** Only present when grounded by a real location provider. */
  address?: string;
  distanceMeters?: number;
  phone?: string;
  source: "demo" | "user_entered" | "provider";
}

export interface UserLocation {
  label: string;
  source: "user_entered" | "device";
  lat?: number;
  lng?: number;
}
