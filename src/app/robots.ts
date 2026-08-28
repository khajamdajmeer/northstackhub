import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The console is also noindex'd by its layout metadata and by a header
        // set in proxy.ts — this just keeps well-behaved crawlers from asking.
        disallow: ["/api/", "/aka", "/aka/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
