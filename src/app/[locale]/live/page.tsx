import { PREVIEW_IMAGE, getOpenGraphLocale } from "@/shared/config";
import { resolveLocale } from "@/shared/i18n/routing";
import type { Locale } from "@/shared/i18n/routing";
import { ActivityFeedPage } from "@/widgets/activity-feed";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface LivePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LivePageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: typedLocale, namespace: "LiveMetadata" });

  return {
    title: t("live_title"),
    description: t("live_description"),
    robots: { index: false, follow: false },
    alternates: {
      canonical: typedLocale === "uk" ? "/live" : "/en/live",
      languages: { uk: "/live", en: "/en/live" },
    },
    openGraph: {
      title: t("live_title"),
      description: t("live_description"),
      type: "website",
      locale: getOpenGraphLocale(typedLocale as Locale),
      images: [{ url: PREVIEW_IMAGE, alt: t("live_title") }],
    },
  };
}

export default async function LivePage({ params }: LivePageProps) {
  const { locale } = await params;
  const typedLocale = resolveLocale(locale);
  setRequestLocale(typedLocale);
  return <ActivityFeedPage locale={typedLocale} />;
}
