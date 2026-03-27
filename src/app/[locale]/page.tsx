import { getStructuredDataJson } from "@/shared/config";
import { resolveLocale } from "@/shared/i18n/routing";
import { VisitedRouteScript } from "@/shared/lib/VisitedRouteScript";
import { InvitationPage } from "@/widgets/invitation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const typedLocale = resolveLocale(locale);
  const structuredDataJson = getStructuredDataJson(typedLocale);
  const route = typedLocale === "en" ? "/en" : "/";

  return (
    <>
      <VisitedRouteScript route={route} />
      <script id={`structured-data-${locale}`} type="application/ld+json">
        {structuredDataJson}
      </script>
      <InvitationPage />
    </>
  );
}
