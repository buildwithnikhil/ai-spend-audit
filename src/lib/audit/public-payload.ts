import type { AuditEngineResult } from "@/lib/audit-engine";

export function toSanitizedPublicPayload(result: AuditEngineResult) {
  return {
    tools: result.tools.map((t) => ({
      vendorName: t.vendorName,
      currentPlanLabel: t.currentPlanLabel,
      recommendedPlanLabel: t.recommendedPlanLabel,
      monthlySavings: t.monthlySavings,
      reasoning: t.reasoning,
    })),
    totals: {
      monthlySpend: result.totalMonthlySpend,
      monthlySavings: result.totalMonthlySavings,
      annualSavings: result.totalAnnualSavings,
      optimizationScore: result.optimizationScore,
      efficiencyScore: result.efficiencyScore,
    },
  };
}
