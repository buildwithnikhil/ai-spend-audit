import type { PricingPlan, PricingVendor } from "@/lib/pricing/types";

/** Estimated fair bench monthly USD from published models; null when usage-based only. */
export function estimatePlanMonthlyUsd(plan: PricingPlan, seats: number): number | null {
  switch (plan.model) {
    case "flat":
      return plan.monthlyUsd ?? 0;
    case "per_seat": {
      const per = plan.monthlyUsdPerSeat ?? 0;
      return per * Math.max(1, seats);
    }
    case "hybrid": {
      const base = plan.baseMonthlyUsd ?? 0;
      const included = plan.seatsIncluded ?? 0;
      const extra = Math.max(0, seats - included);
      return base + extra * (plan.monthlyUsdPerSeat ?? 0);
    }
    case "enterprise_bench": {
      const minSeats = Math.max(1, plan.minBillSeats ?? 1);
      const billSeats = Math.max(minSeats, seats);
      const bench = plan.benchPerSeatUsd ?? 0;
      return billSeats * bench;
    }
    case "usage":
      return null;
    default:
      return null;
  }
}

export function sortedPlansByTier(vendor: PricingVendor): PricingPlan[] {
  return [...vendor.plans].sort((a, b) => a.tier - b.tier);
}

export function pickLowerTierPlan(
  vendor: PricingVendor,
  current: PricingPlan,
  seats: number,
): PricingPlan | null {
  const eligible = sortedPlansByTier(vendor).filter((p) => p.tier < current.tier && p.tier >= 0);
  for (let i = eligible.length - 1; i >= 0; i--) {
    const candidate = eligible[i];
    const bench = estimatePlanMonthlyUsd(candidate, seats);
    if (bench !== null) return candidate;
  }
  return null;
}
