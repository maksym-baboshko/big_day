import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { COUPLE, VENUE, WEDDING_DATE } from "@/shared/config";
import { playfair, inter, cinzel, vibes, THEME_INIT_SCRIPT } from "@/shared/lib";
import { ThemeProvider } from "@/features/theme-switcher";
import { routing, type Locale } from "@/shared/i18n/routing";
import "../globals.css";

const PREVIEW_IMAGE = "/images/preview/og-image.jpg";
const PREVIEW_IMAGE_WIDTH = 1200;
const PREVIEW_IMAGE_HEIGHT = 630;

const DEFAULT_SITE_URL = "http://localhost:3000";

function getMetadataBase() {
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

function resolveLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.defaultLocale;
}

function getLocalePath(locale: Locale) {
  return locale === "uk" ? "/" : "/en";
}

function getOpenGraphLocale(locale: Locale) {
  return locale === "uk" ? "uk_UA" : "en_US";
}

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
  const t = await getTranslations({
    locale: typedLocale,
    namespace: "Metadata",
  });
  const title = t("title");
  const description = t("description");
  const siteName = `${COUPLE.groom.name[typedLocale]} & ${COUPLE.bride.name[typedLocale]}`;
  const localePath = getLocalePath(typedLocale);
  const alternateLocale = typedLocale === "uk" ? "en_US" : "uk_UA";

  return {
    metadataBase,
    title,
    description,
    applicationName: siteName,
    alternates: {
      canonical: localePath,
      languages: {
        uk: "/",
        en: "/en",
        "x-default": "/",
      },
    },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      url: localePath,
      siteName,
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

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);
  const messages = await getMessages();
  const metadataBase = getMetadataBase();
  const localePath = getLocalePath(typedLocale);
  const siteName = `${COUPLE.groom.name[typedLocale]} & ${COUPLE.bride.name[typedLocale]}`;
  const weddingStructuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: siteName,
    description:
      typedLocale === "uk"
        ? "Весільна церемонія та святкування Максима і Діани у Grand Hotel Terminus."
        : "Wedding ceremony and celebration of Maksym and Diana at Grand Hotel Terminus.",
    startDate: WEDDING_DATE.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: typedLocale,
    image: [new URL(PREVIEW_IMAGE, metadataBase).toString()],
    url: new URL(localePath, metadataBase).toString(),
    location: {
      "@type": "Place",
      name: VENUE.name,
      address: VENUE.address,
      geo: {
        "@type": "GeoCoordinates",
        latitude: VENUE.coordinates.lat,
        longitude: VENUE.coordinates.lng,
      },
    },
    organizer: [
      {
        "@type": "Person",
        name: COUPLE.groom.name[typedLocale],
      },
      {
        "@type": "Person",
        name: COUPLE.bride.name[typedLocale],
      },
    ],
  };

  return (
    <html lang={typedLocale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(weddingStructuredData),
          }}
        />
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${cinzel.variable} ${vibes.variable} font-inter antialiased`}
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
