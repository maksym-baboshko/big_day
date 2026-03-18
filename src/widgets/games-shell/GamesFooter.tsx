"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";


export function GamesFooter() {
  const t = useTranslations("GamesShell");
  const tCommon = useTranslations("GamesCommon");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="site-footer" className="relative">
      {/* Gold rule divider */}
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-linear-to-r from-transparent to-accent/15" />
          <svg
            width="7"
            height="7"
            viewBox="0 0 7 7"
            className="shrink-0 rotate-45 text-accent/30"
            aria-hidden="true"
          >
            <rect width="7" height="7" fill="currentColor" />
          </svg>
          <div className="h-px flex-1 bg-linear-to-l from-transparent to-accent/15" />
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 py-12 md:px-8 md:py-16">
        {/* Eyebrow */}
        <p className="text-[10px] uppercase tracking-[0.34em] text-accent md:text-xs">
          {t("eyebrow")}
        </p>

        {/* Navigation */}
        <nav
          aria-label={tCommon("games_navigation")}
          className="flex flex-wrap justify-center gap-6"
        >
          {[
            { href: "/" as const, label: tCommon("home_nav") },
            { href: "/games" as const, label: tCommon("games_nav") },
            { href: "/live" as const, label: tCommon("live_nav") },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-sm px-1 py-0.5 text-[9px] uppercase tracking-[0.2em] text-text-secondary/90 transition-colors duration-300 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary md:text-[10px]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Back to top */}
        <button
          type="button"
          onClick={scrollToTop}
          className="group mt-2 flex cursor-pointer flex-col items-center gap-2 focus-visible:outline-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/25 text-accent/70 transition-all duration-300 group-hover:border-accent/45 group-hover:bg-accent/8 group-hover:text-accent">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </div>
          <span className="text-[8px] uppercase tracking-[0.25em] text-text-secondary/80 transition-colors duration-300 group-hover:text-accent">
            {t("back_to_top")}
          </span>
        </button>


      </div>
    </footer>
  );
}
