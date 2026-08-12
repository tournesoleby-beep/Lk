import type { MetadataRoute } from "next";

// Falls back to lapiitakarya.com only if NEXT_PUBLIC_SITE_URL isn't set —
// make sure that env var is set to https://lapiitakarya.web.id (or
// whichever domain is actually serving this deployment) in production,
// or this file and the sitemap will advertise the wrong host.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lapiitakarya.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/api/*",
        "/cart",
        "/checkout",
        "/checkout/*",
        "/orders",
        "/orders/*",
        "/wishlist",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
