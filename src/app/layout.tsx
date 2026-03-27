import { THEME_STORAGE_KEY, type Theme } from "@/features/theme-switcher/constants";
import { COUPLE, SITE_NAME, VENUE } from "@/shared/config";
import { resolveLocale } from "@/shared/i18n/routing";
import { cinzel, inter, playfair, vibes } from "@/shared/lib";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: `${COUPLE.groom.name.en} & ${COUPLE.bride.name.en}'s Wedding · ${VENUE.locationShort}`,
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = resolveLocale(await getLocale().catch(() => ""));
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_STORAGE_KEY)?.value;
  const theme = themeCookie === "dark" || themeCookie === "light" ? (themeCookie as Theme) : null;
  const themeClassName = theme === "dark" ? "dark" : theme === "light" ? "light" : "";

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable} ${cinzel.variable} ${vibes.variable} ${themeClassName}`}
    >
      <body className="font-inter antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
