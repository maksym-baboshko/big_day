import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { getAllGuestSlugs, getGuestBySlug } from "@/entities/guest";
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

  return {
    title: t("title", { name }),
    description: t("description", { name }),
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { slug, locale } = await params;
  const guest = getGuestBySlug(slug);

  if (!guest) {
    notFound();
  }

  const route = `${resolveLocale(locale) === "en" ? "/en" : ""}/invite/${slug}`;

  return (
    <>
      <VisitedRouteScript route={route} />
      <PersonalInvitationPage guest={guest} />
    </>
  );
}
