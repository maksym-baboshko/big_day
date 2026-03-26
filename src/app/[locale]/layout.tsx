import { ThemeProvider } from "@/features/theme-switcher";
import {
  PREVIEW_IMAGE,
  PREVIEW_IMAGE_HEIGHT,
  PREVIEW_IMAGE_WIDTH,
  SITE_NAME,
  getLocalePath,
  getMetadataBase,
  getOpenGraphLocale,
  getStructuredDataJson,
} from "@/shared/config";
import { type Locale, resolveLocale, routing } from "@/shared/i18n/routing";
import { THEME_INIT_SCRIPT, cinzel, inter, playfair, vibes } from "@/shared/lib";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = resolveLocale(locale);
  const metadataBase = getMetadataBase();
  const localePath = getLocalePath(typedLocale);
  const alternateLocale = typedLocale === "uk" ? "en_US" : "uk_UA";
  const t = await getTranslations({ locale: typedLocale, namespace: "Metadata" });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase,
    title,
    description,
    applicationName: SITE_NAME,
    alternates: {
      canonical: localePath,
      languages: { uk: "/", en: "/en", "x-default": "/" },
    },
    robots: { index: true, follow: true },
    openGraph: {
      url: localePath,
      siteName: SITE_NAME,
      title,
      description,
      type: "website",
      locale: getOpenGraphLocale(typedLocale),
      alternateLocale: [alternateLocale],
      images: [
        {
          url: PREVIEW_IMAGE,
          width: PREVIEW_IMAGE_WIDTH,
          height: PREVIEW_IMAGE_HEIGHT,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [PREVIEW_IMAGE],
    },
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const messages = await getMessages();
  const structuredDataJson = getStructuredDataJson(typedLocale);

  return (
    <html lang={typedLocale} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Inline theme script prevents flash of wrong theme before React hydration */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Script
          id={`structured-data-${typedLocale}`}
          type="application/ld+json"
          strategy="beforeInteractive"
        >
          {structuredDataJson}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${cinzel.variable} ${vibes.variable} font-inter antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
