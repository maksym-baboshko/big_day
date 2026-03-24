export const WEDDING_DATE = new Date("2026-06-28T12:00:00+02:00");

/** Roman numeral representation — use this, never hardcode. */
export const WEDDING_DATE_ROMAN = "XXVIII · VI · MMXXVI" as const;

export const VENUE = {
  name: "Grand Hotel Terminus",
  address: "Zander Kaaes gate 6, Bergen, Norway",
  locationShort: "Bergen · Norway",
  mapsUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1982.6059898754474!2d5.329513116071777!3d60.39067347514558!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x463cfc2a0a16f95b%3A0x7b8e2a2a2b2c2d2e!2sGrand%20Hotel%20Terminus!5e0!3m2!1sen!2sno!4v1620000000000",
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=Grand+Hotel+Terminus+Bergen",
  coordinates: {
    lat: 60.39067347514558,
    lng: 5.3317077777744,
  },
} as const;

export const COUPLE = {
  groom: { name: { uk: "Максим", en: "Maksym" } },
  bride: { name: { uk: "Діана", en: "Diana" } },
} as const;

export const DRESS_CODE = {
  ladies: [
    { hex: "#C4B29A", name: { uk: "Теплий пісочний", en: "Warm Sand" } },
    { hex: "#4A3728", name: { uk: "Темний шоколад", en: "Dark Chocolate" } },
    { hex: "#D4B0A8", name: { uk: "Пильна троянда", en: "Dusty Rose" } },
    { hex: "#A8B8A0", name: { uk: "Шавлія зелена", en: "Sage Green" } },
  ],
  gentlemen: [
    { hex: "#C4B29A", name: { uk: "Теплий пісочний", en: "Warm Sand" } },
    { hex: "#4A3728", name: { uk: "Темний шоколад", en: "Dark Chocolate" } },
    { hex: "#383E42", name: { uk: "Благородний графіт", en: "Slate Graphite" } },
    { hex: "#0A0A0A", name: { uk: "Опівнічний чорний", en: "Midnight Black" } },
  ],
} as const;
