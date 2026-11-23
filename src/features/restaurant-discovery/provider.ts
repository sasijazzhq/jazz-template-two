import type { Branch, UserLocation } from "@/types/domain";
import { DEMO_RESTAURANT } from "@/features/comparison-engine/demo-data";

export type BranchSearch =
  | { kind: "found"; branches: Branch[]; demo: boolean }
  /** No verified provider is connected, so Rusi cannot list real branches. */
  | { kind: "no_provider" };

/** Port: a permitted source of real restaurant branches (e.g. a Places API). */
export interface RestaurantProvider {
  searchBranches(restaurantName: string, location: UserLocation | null): Promise<BranchSearch>;
}

/**
 * Demo provider. Returns clearly labelled sample branches for the demo
 * restaurant only, with no addresses or distances — those must come from a
 * real provider. Every other restaurant gets `no_provider`.
 */
export const demoRestaurantProvider: RestaurantProvider = {
  async searchBranches(restaurantName) {
    const normalized = restaurantName.toLowerCase().replace(/[^a-z]/g, "");
    if (!normalized.startsWith("sshyderabad")) return { kind: "no_provider" };
    return {
      kind: "found",
      demo: true,
      branches: ["Velachery", "Adyar", "T. Nagar"].map((area) => ({
        id: `demo-${area.toLowerCase().replace(/[^a-z]/g, "")}`,
        name: DEMO_RESTAURANT,
        area: `${area}, Chennai`,
        source: "demo" as const,
      })),
    };
  },
};

export function restaurantProvider(): RestaurantProvider {
  return demoRestaurantProvider;
}
