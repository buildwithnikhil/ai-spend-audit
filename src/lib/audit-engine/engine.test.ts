import { describe, expect, it } from "vitest";
import { analyzeTool, runAudit } from "@/lib/audit-engine/engine";
import { estimatePlanMonthlyUsd } from "@/lib/audit-engine/bench";
import type { PricingVendor } from "@/lib/pricing/types";

const mockVendor: PricingVendor = {
  id: "mock_saas",
  name: "Mock SaaS",
  officialPricingUrl: "https://example.com/pricing",
  verificationDate: "2026-05-01",
  plans: [
    { id: "solo", label: "Solo", model: "flat", monthlyUsd: 20, tier: 1 },
    { id: "team", label: "Team", model: "per_seat", monthlyUsdPerSeat: 30, tier: 2 },
    {
      id: "enterprise",
      label: "Enterprise",
      model: "enterprise_bench",
      benchPerSeatUsd: 80,
      minBillSeats: 50,
      tier: 3,
    },
    { id: "api", label: "API", model: "usage", tier: 4 },
  ],
};

const vendors = new Map<string, PricingVendor>([["mock_saas", mockVendor]]);

describe("estimatePlanMonthlyUsd", () => {
  it("multiplies per-seat plans by seats", () => {
    const plan = mockVendor.plans.find((p) => p.id === "team")!;
    expect(estimatePlanMonthlyUsd(plan, 4)).toBe(120);
  });

  it("respects enterprise minimum billing seats for bench modeling", () => {
    const plan = mockVendor.plans.find((p) => p.id === "enterprise")!;
    expect(estimatePlanMonthlyUsd(plan, 5)).toBe(4000);
  });
});

describe("analyzeTool", () => {
  it("detects spend above modeled list pricing", () => {
    const rec = analyzeTool(
      mockVendor,
      { vendorId: "mock_saas", planId: "team", monthlySpend: 200, seats: 4 },
      40,
      "coding",
    );
    expect(rec.monthlySavings).toBeGreaterThan(0);
    expect(rec.reasoning.length).toBeGreaterThan(10);
  });

  it("flags enterprise bench tiers with tiny seat counts vs team context", () => {
    const rec = analyzeTool(
      mockVendor,
      { vendorId: "mock_saas", planId: "enterprise", monthlySpend: 9000, seats: 8 },
      20,
      "coding",
    );
    expect(rec.recommendedPlanId).not.toBe("solo");
    expect(rec.monthlySavings).toBeGreaterThan(0);
  });
});

describe("runAudit totals", () => {
  it("aggregates savings across multiple tools", () => {
    const input = {
      tools: [
        { vendorId: "mock_saas", planId: "team", monthlySpend: 240, seats: 4 },
        { vendorId: "mock_saas", planId: "solo", monthlySpend: 80, seats: 1 },
      ],
      teamSize: 25,
      companyStage: "series_a",
      useCase: "mixed" as const,
    };
    const result = runAudit(input, vendors);
    expect(result.tools).toHaveLength(2);
    expect(result.totalMonthlySavings).toBeGreaterThan(0);
    expect(result.optimizationScore).toBeGreaterThanOrEqual(0);
    expect(result.optimizationScore).toBeLessThanOrEqual(100);
  });

  it("handles pure usage SKUs without crashing", () => {
    const input = {
      tools: [{ vendorId: "mock_saas", planId: "api", monthlySpend: 1000, seats: 3 }],
      teamSize: 30,
      companyStage: "seed",
      useCase: "coding" as const,
    };
    const result = runAudit(input, vendors);
    expect(result.tools[0].vendorId).toBe("mock_saas");
    expect(result.totalMonthlySpend).toBe(1000);
  });
});
