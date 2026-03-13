"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
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

export function Navbar() {
  const t = useTranslations("Navbar");
  const liteMotion = useLiteMotion();
  const [isScrolled, setIsScrolled]         = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isMobileMenuOpen]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
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
            className="heading-serif text-xl md:text-2xl text-text-primary hover:text-accent transition-colors shrink-0"
            onClick={(e) => handleLinkClick(e, "hero")}
          >
            M<span className="text-accent italic">&</span>D
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => handleLinkClick(e, link.id)}
                className="text-xs uppercase tracking-widest font-medium text-text-secondary hover:text-accent transition-colors relative group py-2"
              >
                {t(link.label)}
                <span className="absolute bottom-0 left-0 w-full h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              </a>
            ))}
            <div className="w-px h-4 bg-accent/30 mx-2" />
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 focus:outline-none"
              aria-label="Toggle menu"
            >
              <motion.span animate={isMobileMenuOpen ? { rotate: 45, y: 8 }  : { rotate: 0, y: 0 }} className="w-6 h-0.5 bg-text-primary rounded-full" />
              <motion.span animate={isMobileMenuOpen ? { opacity: 0 }         : { opacity: 1 }}      className="w-6 h-0.5 bg-text-primary rounded-full" />
              <motion.span animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} className="w-6 h-0.5 bg-text-primary rounded-full" />
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
            <nav className="flex flex-col justify-center h-full pt-16 px-8 pb-24">
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
                    href={`#${link.id}`}
                    onClick={(e) => handleLinkClick(e, link.id)}
                    className="flex items-center gap-4 py-[0.9rem]"
                  >
                    <span className="font-cinzel text-[9px] tracking-widest text-accent/40 w-5 shrink-0 mt-0.5">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="heading-serif text-[1.7rem] leading-none text-text-primary group-hover:text-accent transition-colors duration-300">
                      {t(link.label)}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="ml-auto text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
