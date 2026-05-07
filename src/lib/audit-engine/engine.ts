import type { PricingPlan, PricingVendor } from "@/lib/pricing/types";
import { estimatePlanMonthlyUsd, pickLowerTierPlan, sortedPlansByTier } from "./bench";

export type AuditUseCase = "coding" | "writing" | "research" | "data" | "mixed";

export interface AuditToolInput {
  vendorId: string;
  planId: string;
  monthlySpend: number;
  seats: number;
}

export interface AuditInput {
  tools: AuditToolInput[];
  teamSize: number;
  companyStage: string;
  useCase: AuditUseCase;
}

export interface ToolRecommendation {
  vendorId: string;
  vendorName: string;
  currentPlanId: string;
  currentPlanLabel: string;
  currentMonthlySpend: number;
  recommendedPlanId: string;
  recommendedPlanLabel: string;
  monthlySavings: number;
  annualSavings: number;
  reasoning: string;
}

export interface AuditEngineResult {
  tools: ToolRecommendation[];
  totalMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  optimizationScore: number;
  efficiencyScore: number;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function analyzeTool(
  vendor: PricingVendor,
  tool: AuditToolInput,
  teamSize: number,
  useCase: AuditUseCase,
): ToolRecommendation {
  const plan = vendor.plans.find((p) => p.id === tool.planId);
  if (!plan) {
    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      currentPlanId: tool.planId,
      currentPlanLabel: tool.planId,
      currentMonthlySpend: tool.monthlySpend,
      recommendedPlanId: tool.planId,
      recommendedPlanLabel: tool.planId,
      monthlySavings: 0,
      annualSavings: 0,
      reasoning:
        "Unknown plan selected; verify SKU against current vendor pricing before optimizing.",
    };
  }

  const spend = tool.monthlySpend;
  const seats = Math.max(1, tool.seats);
  let recommendedPlan: PricingPlan = plan;
  const reasoningParts: string[] = [];

  const bench = estimatePlanMonthlyUsd(plan, seats);

  if (bench !== null && spend > bench * 1.12) {
    reasoningParts.push(
      `Spend is about ${Math.round((spend / bench - 1) * 100)}% above modeled list pricing for ${plan.label} at ${seats} seat(s).`,
    );
    reasoningParts.push(
      "Negotiate renewals, verify invoices, or consolidate duplicate subscriptions.",
    );
  }

  const hasTeamLikeName =
    /team|business|enterprise/i.test(plan.label) || /team|business|enterprise/i.test(plan.id);

  if (hasTeamLikeName && seats <= 2) {
    const lower = pickLowerTierPlan(vendor, plan, seats);
    const lowerBench = lower ? estimatePlanMonthlyUsd(lower, seats) : null;
    if (lower && lowerBench !== null && lowerBench < spend) {
      recommendedPlan = lower;
      reasoningParts.push(
        `Team or Business pricing with only ${seats} active seat(s) is often inefficient — lower tiers typically fit better.`,
      );
    }
  }

  if (plan.model === "enterprise_bench" && teamSize < 50 && seats < (plan.minBillSeats ?? 99)) {
    const mid = sortedPlansByTier(vendor).find((p) => p.tier === 2 || /business|team/i.test(p.id));
    if (mid && mid.id !== plan.id) {
      const midBench = estimatePlanMonthlyUsd(mid, seats);
      if (midBench !== null && midBench < spend) {
        recommendedPlan = mid;
        reasoningParts.push(
          "Enterprise agreements trade complexity for volume; small seat counts rarely justify modeled premiums.",
        );
      }
    }
  }

  if (plan.model === "usage") {
    if (spend > 400 && (useCase === "coding" || useCase === "writing")) {
      reasoningParts.push(
        "Heavy interactive usage via API can exceed bundled subscription economics — compare flat-rate assistants vs metered tokens.",
      );
    }
    if (spend > 1200) {
      reasoningParts.push(
        "High API burn warrants committed tiers, caching, and routing cheaper models for bulk tasks.",
      );
    }
    const syntheticBench = Math.min(spend, spend * 0.85);
    reasoningParts.push(
      "Usage SKUs have no fixed bench here — savings assume ~15% leakage reduction via routing and caps (adjust to your telemetry).",
    );
    recommendedPlan = plan;
    const target = roundMoney(syntheticBench);
    const savings = roundMoney(Math.max(0, spend - target));
    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      currentPlanId: plan.id,
      currentPlanLabel: plan.label,
      currentMonthlySpend: spend,
      recommendedPlanId: recommendedPlan.id,
      recommendedPlanLabel: recommendedPlan.label,
      monthlySavings: savings,
      annualSavings: roundMoney(savings * 12),
      reasoning: reasoningParts.join(" "),
    };
  }

  const recBench = estimatePlanMonthlyUsd(recommendedPlan, seats);
  let monthlySavings = 0;
  if (recBench !== null) {
    monthlySavings = roundMoney(Math.max(0, spend - recBench));
    if (recommendedPlan.id === plan.id && monthlySavings === 0 && bench !== null && spend > bench) {
      monthlySavings = roundMoney(Math.max(0, spend - bench));
      reasoningParts.push("Trimming to modeled fair pricing captures immediate savings.");
    }
  }

  if (reasoningParts.length === 0) {
    reasoningParts.push(
      "Plan selection appears reasonably aligned with modeled pricing for the declared seats.",
    );
  }

  const annual = roundMoney(monthlySavings * 12);

  return {
    vendorId: vendor.id,
    vendorName: vendor.name,
    currentPlanId: plan.id,
    currentPlanLabel: plan.label,
    currentMonthlySpend: spend,
    recommendedPlanId: recommendedPlan.id,
    recommendedPlanLabel: recommendedPlan.label,
    monthlySavings,
    annualSavings: annual,
    reasoning: reasoningParts.join(" "),
  };
}

export function runAudit(input: AuditInput, vendors: Map<string, PricingVendor>): AuditEngineResult {
  const tools: ToolRecommendation[] = [];
  let totalSpend = 0;
  let totalSavings = 0;

  for (const t of input.tools) {
    const v = vendors.get(t.vendorId);
    if (!v) continue;
    const rec = analyzeTool(v, t, input.teamSize, input.useCase);
    tools.push(rec);
    totalSpend += rec.currentMonthlySpend;
    totalSavings += rec.monthlySavings;
  }

  totalSpend = roundMoney(totalSpend);
  totalSavings = roundMoney(totalSavings);

  const wasteRatio = totalSpend > 0 ? totalSavings / totalSpend : 0;
  const optimizationScore = Math.round(clamp(100 - wasteRatio * 100, 0, 100));

  let penalties = 0;
  for (const t of input.tools) {
    const v = vendors.get(t.vendorId);
    const plan = v?.plans.find((p) => p.id === t.planId);
    if (plan?.model === "enterprise_bench" && t.seats < (plan.minBillSeats ?? 50)) {
      penalties += 12;
    }
    if (/team|business/i.test(plan?.id ?? "") && t.seats <= 1) {
      penalties += 8;
    }
  }
  const efficiencyScore = Math.round(clamp(100 - penalties, 0, 100));

  return {
    tools,
    totalMonthlySpend: totalSpend,
    totalMonthlySavings: totalSavings,
    totalAnnualSavings: roundMoney(totalSavings * 12),
    optimizationScore,
    efficiencyScore,
  };
}
