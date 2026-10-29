import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/mijn/", "/en/mijn/", "/de/mijn/", "/inloggen/", "/auth/", "/foto/", "/taal/", "/api/", "/offertelijst/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
