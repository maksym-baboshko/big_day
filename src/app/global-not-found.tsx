import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cookies } from "next/headers";
import { playfair, inter, cinzel, vibes, THEME_INIT_SCRIPT } from "@/shared/lib";
import { Button, Ornament } from "@/shared/ui";
import ukMessages from "@/shared/i18n/messages/uk.json";
import enMessages from "@/shared/i18n/messages/en.json";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Maksym & Diana",
  description: "The page you are looking for does not exist.",
  robots: {
    index: false,
    follow: false,
  },
};

const globalMessages = {
  uk: {
    ...ukMessages.NotFoundPage,
    homeHref: "/",
  },
  en: {
    ...enMessages.NotFoundPage,
    homeHref: "/en",
  },
} as const;

export default async function GlobalNotFound() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "uk";
  const t = globalMessages[locale];
  const secondaryCta = locale === "uk" ? "Перейти до RSVP" : "Go to RSVP";

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${cinzel.variable} ${vibes.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
      </head>
      <body className="font-inter antialiased">
        <div className="relative min-h-screen overflow-hidden bg-bg-primary text-text-primary">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/6 via-transparent to-accent/8" />
          <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-accent/10 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/8 blur-[140px]" />

          <Ornament position="top-left" size="lg" className="opacity-35" />
          <Ornament position="top-right" size="lg" className="opacity-35" />
          <Ornament position="bottom-left" size="md" className="opacity-20" />
          <Ornament position="bottom-right" size="md" className="opacity-20" />

          <div className="relative z-10 flex min-h-screen flex-col">
            <div className="flex items-center justify-between px-6 py-6 md:px-10 md:py-8">
              <a
                href={t.homeHref}
                className="heading-serif text-2xl text-text-primary transition-colors hover:text-accent md:text-3xl"
              >
                M<span className="text-accent italic">&</span>D
              </a>

              <p className="font-cinzel text-[10px] uppercase tracking-[0.34em] text-text-secondary/55 md:text-xs">
                XXVIII · VI · MMXXVI
              </p>
            </div>

            <div className="flex-1 px-6 pb-10 pt-2 md:px-10 md:pb-14 md:pt-6">
              <div className="mx-auto grid h-full max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                <div className="relative">
                  <div className="font-cinzel text-[clamp(7rem,24vw,18rem)] leading-none text-accent/12">
                    404
                  </div>

                  <div className="mt-6 max-w-sm">
                    <p className="text-[10px] uppercase tracking-[0.34em] text-accent/75 md:text-xs">
                      {t.eyebrow}
                    </p>
                    <p className="heading-serif mt-4 text-3xl leading-tight text-text-primary md:text-4xl">
                      {t.left_copy}
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-accent/18 bg-text-primary/96 text-bg-primary shadow-2xl shadow-accent/10 dark:bg-bg-secondary dark:text-text-primary md:rounded-[2.75rem]">
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/12 via-transparent to-accent/8 dark:from-accent/10 dark:to-accent/5" />
                  <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-accent/70 to-transparent" />
                  <div className="pointer-events-none absolute -left-12 top-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
                  <div className="pointer-events-none absolute -right-12 bottom-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

                  <Ornament
                    position="top-left"
                    size="sm"
                    className="left-4 top-5 opacity-20 md:left-7 md:top-7"
                  />
                  <Ornament
                    position="bottom-right"
                    size="sm"
                    className="bottom-4 right-4 opacity-[0.16] md:bottom-7 md:right-7"
                  />

                  <div className="relative z-10 px-7 py-8 md:px-12 md:py-12">
                    <p className="text-[10px] uppercase tracking-[0.34em] text-accent/85 md:text-xs">
                      {t.card_label}
                    </p>

                    <h1 className="heading-serif mt-5 max-w-2xl text-4xl leading-[1.02] text-bg-primary dark:text-text-primary md:text-6xl">
                      {t.title}
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-bg-primary/72 dark:text-text-secondary md:text-lg">
                      {t.description}
                    </p>

                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-bg-primary/58 dark:text-text-secondary/85">
                      {t.hint}
                    </p>

                    <div className="mt-9 flex flex-wrap gap-4">
                      <Button
                        as="a"
                        href={t.homeHref}
                        size="lg"
                        className="min-w-[220px]"
                      >
                        {t.primary_cta}
                      </Button>

                      <Button
                        as="a"
                        href={`${t.homeHref}#rsvp`}
                        variant="outline"
                        size="lg"
                        className="min-w-[220px] border-accent/30 text-bg-primary hover:bg-bg-primary/10 hover:text-bg-primary dark:text-text-primary dark:hover:bg-accent/12 dark:hover:text-text-primary"
                      >
                        {secondaryCta}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
