"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LanguageSwitcher } from "@/features/language-switcher";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Ornament } from "@/shared/ui";
import { cn, useLiteMotion } from "@/shared/lib";
import { Link } from "@/shared/i18n/navigation";

const NAV_LINKS = [
  { id: "hero",       label: "hero" },
  { id: "our-story",  label: "story" },
  { id: "timeline",   label: "timeline" },
  { id: "location",   label: "location" },
  { id: "dress-code", label: "dress_code" },
  { id: "gifts",      label: "gifts" },
  { id: "rsvp",       label: "rsvp" },
];

const ease = [0.22, 1, 0.36, 1] as const;
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

export function Navbar() {
  const t = useTranslations("Navbar");
  const tA11y = useTranslations("Accessibility");
  const liteMotion = useLiteMotion();
  const prefersReducedMotion = useReducedMotion();
  const [isScrolled, setIsScrolled]         = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    const siteFooter = document.getElementById("site-footer");

    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";

    if (isMobileMenuOpen) {
      mainContent?.setAttribute("inert", "");
      siteFooter?.setAttribute("inert", "");
      queueMicrotask(() => firstMobileLinkRef.current?.focus());
    } else {
      mainContent?.removeAttribute("inert");
      siteFooter?.removeAttribute("inert");
    }

    return () => {
      document.body.style.overflow = "unset";
      mainContent?.removeAttribute("inert");
      siteFooter?.removeAttribute("inert");
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const enableKeyboardNavigation = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setIsKeyboardNavigation(true);
      }
    };

    const disableKeyboardNavigation = () => {
      setIsKeyboardNavigation(false);
    };

    document.addEventListener("keydown", enableKeyboardNavigation);
    document.addEventListener("mousedown", disableKeyboardNavigation);
    document.addEventListener("touchstart", disableKeyboardNavigation);
    document.addEventListener("pointerdown", disableKeyboardNavigation);

    return () => {
      document.removeEventListener("keydown", enableKeyboardNavigation);
      document.removeEventListener("mousedown", disableKeyboardNavigation);
      document.removeEventListener("touchstart", disableKeyboardNavigation);
      document.removeEventListener("pointerdown", disableKeyboardNavigation);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        queueMicrotask(() => menuButtonRef.current?.focus());
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 80,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    }
    setIsMobileMenuOpen(false);
  };

  const handleSkipToContent = () => {
    requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus();
    });
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      data-keyboard-nav={isKeyboardNavigation ? "true" : "false"}
    >
      <a href="#main-content" onClick={handleSkipToContent} className="skip-link">
        {tA11y("skip_to_content")}
      </a>

      {/* ── Bar ─────────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative z-60 transition-all duration-500 py-4",
          "border-b",
          isScrolled || isMobileMenuOpen
            ? liteMotion
              ? "bg-bg-primary border-accent/10 shadow-lg py-3 lg:bg-bg-primary/96"
              : "bg-bg-primary border-accent/10 shadow-lg py-3 lg:bg-bg-primary/80 lg:backdrop-blur-2xl"
            : liteMotion
              ? "bg-bg-primary border-transparent lg:bg-bg-primary/92"
              : "bg-bg-primary border-transparent lg:bg-bg-primary/20 lg:backdrop-blur-md"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link
            href="/"
            className={cn(
              "heading-serif rounded-sm text-xl text-text-primary transition-colors hover:text-accent shrink-0 md:text-2xl",
              focusRingClass
            )}
            onClick={(e) => handleLinkClick(e, "hero")}
          >
            M<span className="text-accent italic">&</span>D
          </Link>

          {/* Desktop nav */}
          <nav aria-label={tA11y("primary_navigation")} className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleLinkClick(e, link.id)}
                className={cn(
                  "group relative rounded-sm px-1 py-2 text-xs font-medium uppercase tracking-widest text-text-secondary transition-colors hover:text-accent",
                  focusRingClass
                )}
              >
                {t(link.label)}
                <span className="absolute bottom-0 left-1 right-1 h-px bg-accent scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              </a>
            ))}
            <div aria-hidden="true" className="w-px h-4 bg-accent/30 mx-2" />
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </nav>

          {/* Mobile controls */}
          <div className="lg:hidden flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <div className="w-px h-4 bg-accent/30 mx-1" />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className={cn(
                "flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full",
                focusRingClass
              )}
              aria-label={isMobileMenuOpen ? tA11y("close_menu") : tA11y("open_menu")}
              aria-controls="mobile-navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <motion.span animate={isMobileMenuOpen ? { rotate: 45, y: 8 }  : { rotate: 0, y: 0 }} className="w-6 h-0.5 rounded-full bg-text-primary" />
              <motion.span animate={isMobileMenuOpen ? { opacity: 0 }         : { opacity: 1 }}      className="w-6 h-0.5 rounded-full bg-text-primary" />
              <motion.span animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className="w-6 h-0.5 rounded-full bg-text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed inset-0 bg-bg-primary z-50 lg:hidden overflow-hidden",
              !liteMotion && "backdrop-blur-2xl"
            )}
          >
            {/* Ghost M&D watermark bottom-right */}
            <div aria-hidden="true" className="absolute bottom-0 right-0 pointer-events-none overflow-hidden">
              <span className="font-vibes text-[52vw] leading-none text-accent/6 whitespace-nowrap block translate-x-6 translate-y-4">
                M &amp; D
              </span>
            </div>

            {/* Ornaments */}
            <Ornament position="top-right"   size="lg" className="opacity-[0.07]" />
            <Ornament position="bottom-left" size="sm" className="opacity-[0.05]" />

            {/* Nav links */}
            <nav
              id="mobile-navigation"
              aria-label={tA11y("mobile_navigation")}
              className="flex h-full flex-col justify-center px-8 pb-24 pt-16"
            >
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ delay: 0.05 + index * 0.07, duration: 0.45, ease }}
                  className="group border-b border-accent/10 last:border-0"
                >
                  <a
                    ref={index === 0 ? firstMobileLinkRef : undefined}
                    href={`#${link.id}`}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-sm py-[0.9rem]",
                      focusRingClass
                    )}
                  >
                    <span className="font-cinzel text-[9px] tracking-widest text-accent/40 w-5 shrink-0 mt-0.5">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="heading-serif text-[1.7rem] leading-none text-text-primary transition-colors duration-300 group-hover:text-accent group-focus-visible:text-accent">
                      {t(link.label)}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="ml-auto text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </motion.span>
                  </a>
                </motion.div>
              ))}
            </nav>

            {/* Bottom info bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="absolute bottom-8 left-8 right-8 flex items-center justify-between"
            >
              <span className="font-cinzel text-[8px] tracking-[0.3em] uppercase text-text-secondary/35">
                Bergen · Norway
              </span>
              <span className="font-cinzel text-[8px] tracking-[0.3em] uppercase text-text-secondary/35">
                XXVIII · VI · MMXXVI
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
