import { resolveLiveFeedState } from "@/entities/event";
import { PREVIEW_IMAGE, getOpenGraphLocale } from "@/shared/config";
import { resolveLocale } from "@/shared/i18n/routing";
import { VisitedRouteScript } from "@/shared/lib/VisitedRouteScript";
import { ActivityFeedPage } from "@/widgets/activity-feed";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

interface ActivityFeedPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ state?: string }>;
}

export async function generateMetadata({ params }: ActivityFeedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = resolveLocale(locale);
  const t = await getTranslations({ locale: typedLocale, namespace: "ActivityFeedMetadata" });

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
      locale: getOpenGraphLocale(typedLocale),
      images: [{ url: PREVIEW_IMAGE, alt: t("live_title") }],
    },
  };
}

export default async function ActivityFeedRoute({ params, searchParams }: ActivityFeedPageProps) {
  const { locale } = await params;
  const typedLocale = resolveLocale(locale);
  const resolvedSearchParams = await searchParams;
  setRequestLocale(typedLocale);

  return (
    <>
      <VisitedRouteScript />
      <ActivityFeedPage
        locale={typedLocale}
        initialState={resolveLiveFeedState(resolvedSearchParams?.state)}
      />
    </>
  );
}
