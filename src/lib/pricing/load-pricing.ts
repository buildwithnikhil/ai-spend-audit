import raw from "@/data/pricing.json";
import { pricingDatasetSchema, type PricingDataset, type PricingVendor } from "./types";

let cached: PricingDataset | null = null;

export function loadPricingDataset(): PricingDataset {
  if (cached) return cached;
  cached = pricingDatasetSchema.parse(raw);
  return cached;
}

export function getVendor(vendorId: string): PricingVendor | undefined {
  return loadPricingDataset().vendors.find((v) => v.id === vendorId);
}

export function getPlan(vendorId: string, planId: string) {
  const v = getVendor(vendorId);
  return v?.plans.find((p) => p.id === planId);
}
