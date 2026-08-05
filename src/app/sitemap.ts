import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://xgro.in";

  const staticPages = [
    "",
    "/about",
    "/services",
    "/portfolio",
    "/pricing",
    "/blog",
    "/contact",
    "/faqs",
    "/careers",
    "/terms",
    "/refund-policy",
    "/privacy-policy",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
