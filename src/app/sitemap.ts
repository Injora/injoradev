import type { MetadataRoute } from "next";
import { identity } from "@/content/profile";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: identity.site, lastModified: new Date("2026-09-26"), changeFrequency: "monthly", priority: 1 }];
}
