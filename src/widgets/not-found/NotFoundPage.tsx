"use client";

import { useTheme } from "@/features/theme-switcher";
import { LAST_VISITED_ROUTE_STORAGE_KEY, cn } from "@/shared/lib";
import { Button, Ornament } from "@/shared/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";

import type { Locale } from "@/shared/i18n/routing";
import type { NotFoundPageContent } from "./not-found-content";

interface NotFoundPageProps {
  locale: Locale;
  content: NotFoundPageContent;
}

function resolveBackHref(currentRoute: string, homeHref: string): string {
  const lastVisitedRoute = sessionStorage.getItem(LAST_VISITED_ROUTE_STORAGE_KEY);

  if (!lastVisitedRoute) {
    return homeHref;
  }

  if (
    !lastVisitedRoute.startsWith("/") ||
    lastVisitedRoute === currentRoute ||
    lastVisitedRoute.includes("/__not-found/")
  ) {
    return homeHref;
  }

  return lastVisitedRoute;
}

function getAlternateLocalePath(pathname: string, locale: Locale): string {
  if (locale === "en") {
    if (pathname === "/en") {
      return "/";
    }

    return pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  }

  if (pathname === "/") {
    return "/en";
  }

  return pathname.startsWith("/en") ? pathname : `/en${pathname}`;
}

function ThemeToggleButton({
  switchThemeToDarkLabel,
  switchThemeToLightLabel,
}: Pick<NotFoundPageContent, "switchThemeToDarkLabel" | "switchThemeToLightLabel">) {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="h-10 w-10 rounded-full border border-accent/20 opacity-0" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded-full border border-accent text-accent transition-all duration-300",
        "bg-bg-primary hover:bg-accent hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
      )}
      aria-label={theme === "light" ? switchThemeToDarkLabel : switchThemeToLightLabel}
    >
      {theme === "light" ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

function LanguageToggleButton({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const href = useMemo(() => {
    if (!pathname) {
      return locale === "uk" ? "/en" : "/";
    }

    return getAlternateLocalePath(pathname, locale);
  }, [locale, pathname]);

  const handleClick = () => {
    const nextLocale = locale === "uk" ? "en" : "uk";
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; samesite=lax;`;
    window.location.replace(href);
  };

  if (!mounted) {
    return <div className="h-10 w-10 rounded-full border border-accent/20 opacity-0" />;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded-full border border-accent text-sm font-medium transition-all duration-300",
        "bg-bg-primary text-accent hover:bg-accent hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
      )}
      aria-label={label}
    >
      <span className="pointer-events-none">{locale === "uk" ? "EN" : "UA"}</span>
    </button>
  );
}

export function NotFoundPage({ locale, content }: NotFoundPageProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const backHref = useMemo(() => {
    if (!mounted) {
      return content.homeHref;
    }

    return resolveBackHref(
      `${window.location.pathname}${window.location.search}`,
      content.homeHref,
    );
  }, [mounted, content.homeHref]);

  return (
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
          <Link
            href={content.homeHref}
            className="heading-serif text-2xl text-text-primary transition-colors hover:text-accent md:text-3xl"
          >
            M<span className="text-accent italic">&</span>D
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggleButton
              switchThemeToDarkLabel={content.switchThemeToDarkLabel}
              switchThemeToLightLabel={content.switchThemeToLightLabel}
            />
            <LanguageToggleButton locale={locale} label={content.switchLanguageLabel} />
          </div>
        </div>

        <div className="flex-1 px-6 pb-10 pt-2 md:px-10 md:pb-14 md:pt-6">
          <div className="mx-auto grid h-full max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="relative">
              <div className="font-cinzel text-[clamp(7rem,24vw,18rem)] leading-none text-accent/12">
                404
              </div>

              <div className="mt-6 max-w-sm">
                <p className="text-[10px] uppercase tracking-[0.34em] text-accent md:text-xs">
                  {content.eyebrow}
                </p>
                <p className="heading-serif mt-4 text-3xl leading-tight text-text-primary md:text-4xl">
                  {content.leftCopy}
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-4xl border border-accent/18 bg-text-primary/96 text-bg-primary shadow-2xl shadow-accent/10 dark:bg-bg-secondary dark:text-text-primary md:rounded-[2.75rem]">
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
                  {content.cardLabel}
                </p>

                <h1 className="heading-serif mt-5 max-w-2xl text-4xl leading-[1.02] text-bg-primary dark:text-text-primary md:text-6xl">
                  {content.title}
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-relaxed text-bg-primary/72 dark:text-text-secondary md:text-lg">
                  {content.description}
                </p>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-bg-primary/58 dark:text-text-secondary/85">
                  {content.hint}
                </p>

                <div className="mt-9 flex flex-wrap gap-4">
                  <Button as={Link} href={content.homeHref} size="lg" className="min-w-55">
                    {content.primaryCta}
                  </Button>

                  <Button
                    as={Link}
                    href={backHref}
                    variant="outline"
                    size="lg"
                    className="min-w-55 border-accent/30 text-bg-primary hover:bg-bg-primary/10 hover:text-bg-primary dark:text-text-primary dark:hover:bg-accent/12 dark:hover:text-text-primary"
                  >
                    {content.secondaryCta}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
