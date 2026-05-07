import pricing from "@/data/pricing.json";

export const vendorCatalog = pricing.vendors.map((v) => ({
  id: v.id,
  name: v.name,
  plans: v.plans.map((p) => ({ id: p.id, label: p.label })),
}));

export type VendorCatalogEntry = (typeof vendorCatalog)[number];
