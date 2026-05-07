import { z } from "zod";

export const pricingPlanModelSchema = z.enum([
  "flat",
  "per_seat",
  "hybrid",
  "usage",
  "enterprise_bench",
]);

export type PricingPlanModel = z.infer<typeof pricingPlanModelSchema>;

export const pricingPlanSchema = z.object({
  id: z.string(),
  label: z.string(),
  model: pricingPlanModelSchema,
  /** Flat monthly USD when model is flat */
  monthlyUsd: z.number().optional(),
  /** Per-seat USD when model is per_seat or hybrid add-on */
  monthlyUsdPerSeat: z.number().optional(),
  /** Base flat before seats (hybrid) */
  baseMonthlyUsd: z.number().optional(),
  seatsIncluded: z.number().optional(),
  /** Rough bench for enterprise/custom SKUs */
  benchPerSeatUsd: z.number().optional(),
  minBillSeats: z.number().optional(),
  tier: z.number(),
  alternateVendorHint: z.string().optional(),
});

export type PricingPlan = z.infer<typeof pricingPlanSchema>;

export const pricingVendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  officialPricingUrl: z.string().url(),
  verificationDate: z.string(),
  plans: z.array(pricingPlanSchema),
});

export type PricingVendor = z.infer<typeof pricingVendorSchema>;

export const pricingDatasetSchema = z.object({
  version: z.string(),
  effectiveDate: z.string(),
  currency: z.literal("USD"),
  vendors: z.array(pricingVendorSchema),
});

export type PricingDataset = z.infer<typeof pricingDatasetSchema>;
