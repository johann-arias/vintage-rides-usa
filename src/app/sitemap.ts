import type { MetadataRoute } from "next";
import { DESTINATION_SLUGS } from "@/lib/destinations";

// Date of the last real content change of each page. Update it when a page's
// content changes: a lastmod stamped with the build date on every page teaches
// Google to ignore it (SEO audit of 2026-09-26).
const LAST_CHANGED: Record<string, string> = {
  "/": "2026-09-26",
  "/fleet": "2026-09-26",
  "/book": "2026-09-26",
  "/press": "2026-09-26",
  "/privacy": "2026-09-15",
};
const DESTINATIONS_CHANGED = "2026-09-26";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.vintageridesusa.com";
  const at = (path: string) => new Date(LAST_CHANGED[path] ?? DESTINATIONS_CHANGED);

  return [
    { url: `${base}/`, lastModified: at("/"), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/fleet`, lastModified: at("/fleet"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/book`, lastModified: at("/book"), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/press`, lastModified: at("/press"), changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: at("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    ...DESTINATION_SLUGS.map((slug) => ({
      url: `${base}/${slug}`,
      lastModified: at(`/${slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
  ];
}
