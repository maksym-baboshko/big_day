import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { getAllGuestSlugs, getGuestBySlug } from "@/entities/guest";
import { PREVIEW_IMAGE, getOpenGraphLocale } from "@/shared/config";
import { resolveLocale } from "@/shared/i18n/routing";
import { VisitedRouteScript } from "@/shared/lib/VisitedRouteScript";
import { PersonalInvitationPage } from "@/widgets/personal-invitation";

interface InvitePageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  return getAllGuestSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const guest = getGuestBySlug(slug);
  if (!guest) {
    return { robots: { index: false, follow: false } };
  }

  const t = await getTranslations("InvitePage");
  const typedLocale = resolveLocale(locale);
  const name = guest.name[typedLocale];
  const title = t("title", { name });
  const description = t("description", { name });
  const invitePath = typedLocale === "uk" ? `/invite/${slug}` : `/en/invite/${slug}`;
  const alternateLocale = typedLocale === "uk" ? "en_US" : "uk_UA";

  return {
    title,
    description,
    alternates: {
      canonical: invitePath,
      languages: {
        uk: `/invite/${slug}`,
        en: `/en/invite/${slug}`,
        "x-default": `/invite/${slug}`,
      },
    },
    robots: { index: false, follow: false },
    openGraph: {
      url: invitePath,
      title,
      description,
      type: "website",
      locale: getOpenGraphLocale(typedLocale),
      alternateLocale: [alternateLocale],
      images: [{ url: PREVIEW_IMAGE, alt: title }],
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
  const { slug } = await params;
  const guest = getGuestBySlug(slug);

  if (!guest) {
    notFound();
  }

  return (
    <>
      <VisitedRouteScript />
      <PersonalInvitationPage guest={guest} />
    </>
  );
}
