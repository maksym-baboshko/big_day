import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { getAllGuestSlugs, getGuestBySlug } from "@/shared/config";
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
  if (!guest) return { robots: { index: false, follow: false } };

  const t = await getTranslations("InvitePage");
  const name = locale === "uk" ? guest.name.uk : guest.name.en;

  return {
    title: t("title", { name }),
    description: t("description", { name }),
    robots: { index: false, follow: false },
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { slug } = await params;
  const guest = getGuestBySlug(slug);

  if (!guest) notFound();

  return <PersonalInvitationPage guest={guest} />;
}
