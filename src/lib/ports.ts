/**
 * Provider ports in one place. Presentation → feature services → domain →
 * these ports → external services. Real adapters must use verified, permitted
 * integrations: no scraping, no unofficial Swiggy/Zomato APIs.
 */
import type { Paise } from "@/types/domain";
import type { Session } from "@/lib/store";

export type { RestaurantProvider } from "@/features/restaurant-discovery/provider";
export type { ScreenshotExtractor } from "@/features/price-extraction/gemini";
export type { VoiceCallProvider } from "@/features/restaurant-calling/provider";

/** Planned: a courier service with a real quote and booking API. Not implemented. */
export interface CourierProvider {
  readonly available: boolean;
  quote(pickup: string, drop: string): Promise<{ ok: true; quotePaise: Paise; expiresAt: string } | { ok: false; message: string }>;
}

/** Persistence port. Today: browser localStorage (`src/lib/store.ts`). Planned: Supabase. */
export interface ComparisonRepository {
  load(): Promise<Session[]>;
  save(session: Session): Promise<void>;
  deleteAll(): Promise<void>;
}
