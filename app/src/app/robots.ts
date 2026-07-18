import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/app", "/api", "/auth", "/collections", "/companies", "/connect", "/create-user", "/domains", "/help", "/review", "/shortlists", "/sign-in", "/submit", "/use-cases"]
    }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
