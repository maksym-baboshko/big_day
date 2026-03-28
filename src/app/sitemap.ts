import type { MetadataRoute } from "next";

import { PREVIEW_IMAGE, getMetadataBase, getSiteUrl } from "@/shared/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const metadataBase = getMetadataBase();
  const lastModified = new Date();
  const previewImageUrl = new URL(PREVIEW_IMAGE, metadataBase).toString();

  return [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          uk: `${siteUrl}/`,
          en: `${siteUrl}/en`,
        },
      },
      images: [previewImageUrl],
    },
    {
      url: `${siteUrl}/en`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          uk: `${siteUrl}/`,
          en: `${siteUrl}/en`,
        },
      },
      images: [previewImageUrl],
    },
  ];
}
