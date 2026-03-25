"use client";

import { LanguageSwitcher } from "@/features/language-switcher";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Link } from "@/shared/i18n/navigation";
import { MOTION_EASE, cn } from "@/shared/lib";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface NavLink {
  key: "hero" | "story" | "timeline" | "location" | "dress_code" | "gifts" | "rsvp";
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { key: "story", href: "#story" },
  { key: "timeline", href: "#timeline" },
  { key: "location", href: "#location" },
  { key: "dress_code", href: "#dress-code" },
  { key: "gifts", href: "#gifts" },
  { key: "rsvp", href: "#rsvp" },
];

export function Navbar() {
  const t = useTranslations("Navbar");
  const tA11y = useTranslations("Accessibility");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      setMenuOpen(false);
    }
  }

  return (
    <>
      <nav
        aria-label={tA11y("primary_navigation")}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "bg-bg-primary/90 shadow-sm backdrop-blur-md" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="font-cinzel text-xl font-bold tracking-widest text-accent"
            aria-label="Diandmax — home"
          >
            M & D
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map(({ key, href }) => (
              <li key={key}>
                <a
                  href={href}
                  onClick={(e) => handleNavClick(e, href)}
                  className="font-cinzel text-xs uppercase tracking-wider text-text-secondary transition-colors duration-200 hover:text-accent"
                >
                  {t(key)}
                </a>
              </li>
            ))}
          </ul>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? tA11y("close_menu") : tA11y("open_menu")}
              aria-expanded={menuOpen}
              className="flex flex-col items-center justify-center gap-[5px] md:hidden"
            >
              <span
                className={cn(
                  "block h-0.5 w-5 bg-text-primary transition-transform duration-300",
                  menuOpen && "translate-y-[7px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-5 bg-text-primary transition-opacity duration-300",
                  menuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-5 bg-text-primary transition-transform duration-300",
                  menuOpen && "-translate-y-[7px] -rotate-45",
                )}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: MOTION_EASE }}
            aria-label={tA11y("mobile_navigation")}
            className="fixed inset-x-0 top-[64px] z-40 bg-bg-primary/95 px-5 pb-6 pt-4 backdrop-blur-md shadow-md md:hidden"
          >
            <ul className="flex flex-col gap-4">
              {NAV_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <a
                    href={href}
                    onClick={(e) => handleNavClick(e, href)}
                    className="font-cinzel block text-sm uppercase tracking-wider text-text-secondary py-1 hover:text-accent transition-colors"
                  >
                    {t(key)}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
