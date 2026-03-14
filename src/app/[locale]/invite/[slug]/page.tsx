import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getAllGuestSlugs, getGuestBySlug } from "@/shared/config";
import { routing, type Locale } from "@/shared/i18n/routing";
import { InvitationPage } from "@/widgets/invitation-page";

const PREVIEW_IMAGE = "/images/preview/og-image.jpg";

interface InvitePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export const dynamicParams = false;

function resolveLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.defaultLocale;
}

export function generateStaticParams() {
  return getAllGuestSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: InvitePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const typedLocale = resolveLocale(locale);
  const guest = getGuestBySlug(slug);

  if (!guest) {
    return {};
  }

  const t = await getTranslations({
    locale: typedLocale,
    namespace: "InvitePage",
  });

  const name = guest.name[typedLocale];
  const title = t("title", { name });
  const description = t("description", { name });
  const pagePath =
    typedLocale === "uk" ? `/invite/${slug}` : `/en/invite/${slug}`;
  const alternateLocale = typedLocale === "uk" ? "en_US" : "uk_UA";

  return {
    title,
    description,
    alternates: {
      canonical: pagePath,
      languages: {
        uk: `/invite/${slug}`,
        en: `/en/invite/${slug}`,
        "x-default": `/invite/${slug}`,
      },
    },
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      url: pagePath,
      title,
      description,
      type: "website",
      locale: typedLocale === "uk" ? "uk_UA" : "en_US",
      alternateLocale: [alternateLocale],
      images: [
        {
          url: PREVIEW_IMAGE,
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

export default async function InvitePage({ params }: InvitePageProps) {
  const { locale, slug } = await params;
  const typedLocale = resolveLocale(locale);
  const guest = getGuestBySlug(slug);

  if (!guest) {
    notFound();
  }

  setRequestLocale(typedLocale);

  return <InvitationPage guest={guest} />;
}
