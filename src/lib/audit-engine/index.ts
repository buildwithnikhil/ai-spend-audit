import { loadPricingDataset } from "@/lib/pricing/load-pricing";
import type { PricingVendor } from "@/lib/pricing/types";
import { runAudit, type AuditInput, type AuditEngineResult } from "./engine";

export type { AuditInput, AuditEngineResult, ToolRecommendation } from "./engine";

export function buildVendorMap(): Map<string, PricingVendor> {
  const ds = loadPricingDataset();
  return new Map(ds.vendors.map((v) => [v.id, v]));
}

export function auditFromInput(input: AuditInput): AuditEngineResult {
  return runAudit(input, buildVendorMap());
}
