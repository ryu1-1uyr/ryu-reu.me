import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/og"],
      disallow: ["/upload", "/login", "/api/"],
    },
    sitemap: "https://www.ryu-reu.me/sitemap.xml",
  };
}
