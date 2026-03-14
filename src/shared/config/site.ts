import type { Locale } from "@/shared/i18n/routing";

const DEFAULT_SITE_URL = "http://localhost:3000";

export const SITE_NAME = "Diandmax";
export const SITE_ALTERNATE_NAME = "Maksym & Diana Wedding";
export const PREVIEW_IMAGE = "/images/preview/og-image.jpg";
export const PREVIEW_IMAGE_WIDTH = 1200;
export const PREVIEW_IMAGE_HEIGHT = 630;

export function getMetadataBase() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!configuredSiteUrl) {
    return new URL(DEFAULT_SITE_URL);
  }

  const normalizedSiteUrl = configuredSiteUrl.startsWith("http")
    ? configuredSiteUrl
    : `https://${configuredSiteUrl}`;

  try {
    return new URL(normalizedSiteUrl);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function getSiteUrl() {
  return getMetadataBase().toString().replace(/\/$/, "");
}

export function getLocalePath(locale: Locale) {
  return locale === "uk" ? "/" : "/en";
}

export function getOpenGraphLocale(locale: Locale) {
  return locale === "uk" ? "uk_UA" : "en_US";
}
