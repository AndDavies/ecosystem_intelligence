import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin/", "/auth/", "/collections/", "/connect/", "/create-user", "/submit/", "/sign-in", "/app/", "/review/", "/api/"]
    }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
