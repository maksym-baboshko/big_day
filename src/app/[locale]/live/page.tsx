import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  PREVIEW_IMAGE,
  getOpenGraphLocale,
  type SupportedLocale,
} from "@/shared/config";
import { resolveLocale } from "@/shared/i18n/routing";
import { LiveProjectorPage } from "@/widgets/live-projector";

interface LivePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LivePageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = resolveLocale(locale);
  const t = await getTranslations({
    locale: typedLocale,
    namespace: "LiveMetadata",
  });

  return {
    title: t("live_title"),
    description: t("live_description"),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: typedLocale === "uk" ? "/live" : "/en/live",
      languages: {
        uk: "/live",
        en: "/en/live",
      },
    },
    openGraph: {
      title: t("live_title"),
      description: t("live_description"),
      type: "website",
      locale: getOpenGraphLocale(typedLocale as SupportedLocale),
      images: [
        {
          url: PREVIEW_IMAGE,
          alt: t("live_title"),
        },
      ],
    },
  };
}

export default async function LivePage({ params }: LivePageProps) {
  const { locale } = await params;
  const typedLocale = resolveLocale(locale);

  setRequestLocale(typedLocale);

  return <LiveProjectorPage />;
}
