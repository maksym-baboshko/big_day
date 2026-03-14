import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  COUPLE,
  PREVIEW_IMAGE,
  PREVIEW_IMAGE_HEIGHT,
  PREVIEW_IMAGE_WIDTH,
  SITE_ALTERNATE_NAME,
  SITE_NAME,
  VENUE,
  WEDDING_DATE,
  getLocalePath,
  getMetadataBase,
  getOpenGraphLocale,
} from "@/shared/config";
import { playfair, inter, cinzel, vibes, THEME_INIT_SCRIPT } from "@/shared/lib";
import { ThemeProvider } from "@/features/theme-switcher";
import { routing, type Locale } from "@/shared/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function resolveLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.defaultLocale;
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
  const t = await getTranslations({
    locale: typedLocale,
    namespace: "Metadata",
  });
  const title = t("title");
  const description = t("description");

  return {
    metadataBase,
    title,
    description,
    applicationName: SITE_NAME,
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
  const weddingDisplayName = `${COUPLE.groom.name[typedLocale]} & ${COUPLE.bride.name[typedLocale]}`;
  const siteDescription =
    typedLocale === "uk"
      ? "Персональний весільний сайт Максима і Діани з деталями церемонії, RSVP та інформацією для гостей."
      : "A personal wedding website for Maksym and Diana with ceremony details, RSVP, and guest information.";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": new URL("/#website", metadataBase).toString(),
        url: new URL("/", metadataBase).toString(),
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        description: siteDescription,
      },
      {
        "@type": "Event",
        "@id": new URL(`${localePath}#event`, metadataBase).toString(),
        name: weddingDisplayName,
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
        isPartOf: {
          "@id": new URL("/#website", metadataBase).toString(),
        },
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
            __html: JSON.stringify(structuredData),
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
