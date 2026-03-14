import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { playfair, inter, cinzel, vibes, THEME_INIT_SCRIPT } from "@/shared/lib";
import { ThemeProvider } from "@/features/theme-switcher";
import { routing, type Locale } from "@/shared/i18n/routing";
import "../globals.css";

const TITLE = "Максим & Діана — 28.06.2026";
const DESCRIPTION =
  "Весільне запрошення Максима та Діани. 28 червня 2026, Grand Hotel Terminus, Bergen, Norway.";
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function generateMetadata(): Metadata {
  const metadataBase = getMetadataBase();

  return {
    metadataBase,
    title: TITLE,
    description: DESCRIPTION,
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    },
    openGraph: {
      url: metadataBase,
      siteName: "Diandmax",
      title: TITLE,
      description: DESCRIPTION,
      type: "website",
      locale: "uk_UA",
      alternateLocale: "en_US",
      images: [
        {
          url: PREVIEW_IMAGE,
          width: PREVIEW_IMAGE_WIDTH,
          height: PREVIEW_IMAGE_HEIGHT,
          alt: TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
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

  return (
    <html lang={typedLocale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
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
      </body>
    </html>
  );
}
