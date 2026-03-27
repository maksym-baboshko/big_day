import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["uk", "en"],
  defaultLocale: "uk",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing)["locales"][number];

export function isLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}

export function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : routing.defaultLocale;
}
