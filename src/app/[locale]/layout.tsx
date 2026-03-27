import { ThemeProvider } from "@/features/theme-switcher";
import {
  PREVIEW_IMAGE,
  PREVIEW_IMAGE_HEIGHT,
  PREVIEW_IMAGE_WIDTH,
  SITE_NAME,
  getLocalePath,
  getMetadataBase,
  getOpenGraphLocale,
} from "@/shared/config";
import { isLocale, resolveLocale, routing } from "@/shared/i18n/routing";
import { NotFoundPage, getNotFoundPageContent } from "@/widgets/not-found";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

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

  if (!isLocale(locale)) {
    const cookieStore = await cookies();
    const resolvedLocale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value ?? "");
    const content = getNotFoundPageContent(resolvedLocale);

    return (
      <ThemeProvider>
        <NotFoundPage locale={resolvedLocale} content={content} />
      </ThemeProvider>
    );
  }

  const typedLocale = resolveLocale(locale);
  const messages = await getMessages({ locale: typedLocale });

  return (
    <NextIntlClientProvider locale={typedLocale} messages={messages}>
      <ThemeProvider>{children}</ThemeProvider>
    </NextIntlClientProvider>
  );
}
