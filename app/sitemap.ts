import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "@/lib/site";

const lastModified = new Date("2026-03-19T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getAbsoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getAbsoluteUrl("/privacy"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: getAbsoluteUrl("/terms"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
