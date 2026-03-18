import type { Locale } from "@/shared/i18n/routing";
import { COUPLE, VENUE, WEDDING_DATE } from "./wedding";
import {
  PREVIEW_IMAGE,
  SITE_ALTERNATE_NAME,
  SITE_NAME,
  getLocalePath,
  getMetadataBase,
} from "./site";

export function getStructuredDataJson(locale: Locale) {
  const metadataBase = getMetadataBase();
  const localePath = getLocalePath(locale);
  const weddingDisplayName = `${COUPLE.groom.name[locale]} & ${COUPLE.bride.name[locale]}`;
  const siteDescription =
    locale === "uk"
      ? "Персональний весільний сайт Максима і Діани з деталями церемонії, RSVP та інформацією для гостей."
      : "A personal wedding website for Maksym and Diana with ceremony details, RSVP, and guest information.";

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": new URL("/#website", metadataBase).toString(),
        url: new URL("/", metadataBase).toString(),
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        description: siteDescription,
      },
      {
        "@type": "Event",
        "@id": new URL(`${localePath}#event`, metadataBase).toString(),
        name: weddingDisplayName,
        description:
          locale === "uk"
            ? "Весільна церемонія та святкування Максима і Діани у Grand Hotel Terminus."
            : "Wedding ceremony and celebration of Maksym and Diana at Grand Hotel Terminus.",
        startDate: WEDDING_DATE.toISOString(),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        inLanguage: locale,
        image: [new URL(PREVIEW_IMAGE, metadataBase).toString()],
        url: new URL(localePath, metadataBase).toString(),
        location: {
          "@type": "Place",
          name: VENUE.name,
          address: VENUE.address,
          geo: {
            "@type": "GeoCoordinates",
            latitude: VENUE.coordinates.lat,
            longitude: VENUE.coordinates.lng,
          },
        },
        organizer: [
          {
            "@type": "Person",
            name: COUPLE.groom.name[locale],
          },
          {
            "@type": "Person",
            name: COUPLE.bride.name[locale],
          },
        ],
        isPartOf: {
          "@id": new URL("/#website", metadataBase).toString(),
        },
      },
    ],
  });
}
