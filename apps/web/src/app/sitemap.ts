import type { MetadataRoute } from "next";

const BASE_URL = "https://saasifyy.tech";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/marketplace`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Fetch published product slugs for dynamic pages
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const res = await fetch(`${apiUrl}/products?limit=100&status=PUBLISHED`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const products = json.data?.products ?? [];
      const productPages: MetadataRoute.Sitemap = products.map((p: { slug: string; updatedAt: string }) => ({
        url: `${BASE_URL}/marketplace/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
      return [...staticPages, ...productPages];
    }
  } catch {
    // API unavailable — return static pages only
  }

  return staticPages;
}
