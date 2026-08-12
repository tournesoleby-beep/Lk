import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

// Same fallback pattern as app/layout.tsx and app/robots.ts — set
// NEXT_PUBLIC_SITE_URL in production so this points at the real domain
// (https://lapiitakarya.web.id), not the lapiitakarya.com fallback.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapiitakarya.com";

// Static, always-public marketing/info pages. Auth-gated, transactional,
// and admin routes (cart, checkout, orders, wishlist, /admin/*) are left
// out on purpose — nothing there is meant to be indexed, and app/robots.ts
// disallows them too.
const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.4 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.3 },
  { path: "/sustainability", changeFrequency: "monthly", priority: 0.3 },
  { path: "/shipping-returns", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Categories and products both resolve under /shop/[slug] (see
  // app/shop/[category]/page.tsx), so both get listed under that prefix.
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/shop/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/shop/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
