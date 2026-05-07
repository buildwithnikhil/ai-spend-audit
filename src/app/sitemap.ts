import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const lastModified = new Date();
  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/audit`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/audit/results`, lastModified, changeFrequency: "weekly", priority: 0.6 },
  ];
}
