import type { MetadataRoute } from "next";
import { DESTINATION_SLUGS } from "@/lib/destinations";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.vintageridesusa.com";
  const lastModified = new Date();

  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/fleet`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/book`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/press`, lastModified, changeFrequency: "yearly", priority: 0.5 },
    ...DESTINATION_SLUGS.map((slug) => ({
      url: `${base}/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ];
}
