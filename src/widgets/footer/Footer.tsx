"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Ornament } from "@/shared/ui";
import { VENUE, WEDDING_DATE } from "@/shared/config";
import { useLiteMotion } from "@/shared/lib";

const romanDate = "XXVIII · VI · MMXXVI";
const ease = [0.22, 1, 0.36, 1] as const;

export function Footer() {
  const t = useTranslations("Footer");
  const tHero = useTranslations("Hero");
  const tNavbar = useTranslations("Navbar");
  const liteMotion = useLiteMotion();
  const reduceMotion = useReducedMotion();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const navLinks = [
    { href: "#our-story", label: tNavbar("story") },
    { href: "#timeline", label: tNavbar("timeline") },
    { href: "#location", label: tNavbar("location") },
    { href: "#dress-code", label: tNavbar("dress_code") },
    { href: "#gifts", label: tNavbar("gifts") },
    { href: "#rsvp", label: tNavbar("rsvp") },
  ];

  return (
    <footer id="site-footer" className="relative overflow-hidden bg-bg-secondary">
      {/* Smooth fade from previous section (bg-primary → bg-secondary) */}
      <div
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-16 md:h-32 bg-linear-to-b from-bg-primary to-transparent pointer-events-none z-10"
      />

      {/* Top gold separator */}
      <div className="relative z-20 mt-12 md:mt-28">
        <hr className="gold-rule" />
      </div>

      {/* Ghost script watermark */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        {/* Mobile: initials only */}
        <span className="md:hidden font-vibes text-[55vw] leading-none text-accent/4.5 whitespace-nowrap -translate-x-[10%]">
          М &amp; Д
        </span>
        {/* Desktop: full names */}
        <span className="hidden md:inline font-vibes text-[26vw] leading-none text-accent/4.5 whitespace-nowrap -translate-x-[8%] translate-y-[12%]">
          {tHero("groom_name")} &amp; {tHero("bride_name")}
        </span>
      </div>

      {/* Corner ornaments */}
      <Ornament position="top-left"     size="lg" className="opacity-[0.09]" />
      <Ornament position="top-right"    size="lg" className="opacity-[0.09]" />
      <Ornament position="bottom-left"  size="sm" className="opacity-[0.06]" />
      <Ornament position="bottom-right" size="sm" className="opacity-[0.06]" />

      <div className="relative max-w-4xl mx-auto px-6 pt-10 md:pt-32 pb-10 flex flex-col items-center gap-10">

        {/* Location label */}
        <div className="flex items-center gap-3">
          <span className="block h-px w-10 bg-linear-to-r from-transparent to-accent/35" />
          <span className="text-[9px] tracking-[0.35em] uppercase text-text-secondary/55 font-medium">
            Bergen · Norway
          </span>
          <span className="block h-px w-10 bg-linear-to-l from-transparent to-accent/35" />
        </div>

        {/* Names block */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="heading-serif text-[2.5rem] md:text-[4.25rem] leading-none tracking-tight text-text-primary">
            {tHero("groom_name")}
            <span className="heading-serif-italic text-accent mx-3 md:mx-5 text-[2rem] md:text-[3.25rem]">
              &amp;
            </span>
            {tHero("bride_name")}
          </h2>

          <p className="font-cinzel text-[0.6rem] md:text-[0.7rem] tracking-[0.45em] text-text-secondary/70 uppercase mt-1">
            {romanDate}
          </p>

          <p className="text-xs tracking-wider text-text-secondary/50 mt-0.5">
            {VENUE.name}
          </p>
        </div>

        {/* Diamond divider */}
        <div className="flex items-center gap-3 w-full max-w-[12rem]">
          <div className="h-px flex-1 bg-linear-to-r from-transparent to-accent/35" />
          <svg
            width="7"
            height="7"
            viewBox="0 0 7 7"
            className="text-accent/45 flex-shrink-0 rotate-45"
          >
            <rect width="7" height="7" fill="currentColor" />
          </svg>
          <div className="h-px flex-1 bg-linear-to-l from-transparent to-accent/35" />
        </div>

        {/* Nav links */}
        <nav aria-label={t("section_navigation")}>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  className="rounded-sm px-1 py-0.5 text-[9px] tracking-[0.2em] uppercase text-text-secondary/45 transition-colors duration-300 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary md:text-[10px]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Back to top */}
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label={t("back_to_top")}
          className="group mt-1 flex flex-col items-center gap-2 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, liteMotion ? -3 : -4, 0],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: liteMotion ? 3.2 : 3.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          style={{ willChange: reduceMotion ? "auto" : "transform" }}
        >
          <motion.div
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, liteMotion ? 1.035 : 1.05, 1],
                    borderColor: [
                      "rgba(var(--accent-rgb,180,140,100),0.2)",
                      "rgba(var(--accent-rgb,180,140,100),0.42)",
                      "rgba(var(--accent-rgb,180,140,100),0.2)",
                    ],
                    backgroundColor: [
                      "rgba(var(--accent-rgb,180,140,100),0)",
                      "rgba(var(--accent-rgb,180,140,100),0.08)",
                      "rgba(var(--accent-rgb,180,140,100),0)",
                    ],
                    color: [
                      "rgba(var(--accent-rgb,180,140,100),0.45)",
                      "rgba(var(--accent-rgb,180,140,100),0.88)",
                      "rgba(var(--accent-rgb,180,140,100),0.45)",
                    ],
                  }
            }
            whileHover={
              liteMotion || reduceMotion
                ? undefined
                : {
                    scale: 1.06,
                    backgroundColor: "rgba(var(--accent-rgb,180,140,100),0.1)",
                    borderColor: "rgba(var(--accent-rgb,180,140,100),0.5)",
                    color: "rgba(var(--accent-rgb,180,140,100),1)",
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                  duration: liteMotion ? 3.2 : 3.6,
                  repeat: Infinity,
                  ease,
                }
            }
            className="w-11 h-11 rounded-full border border-accent/20 flex items-center justify-center text-accent/45 transition-all duration-500"
            style={{ willChange: reduceMotion ? "auto" : "transform, opacity" }}
          >
            <motion.svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={reduceMotion ? undefined : { y: [0, liteMotion ? -1 : -1.5, 0] }}
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: liteMotion ? 1.9 : 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
              style={{ willChange: reduceMotion ? "auto" : "transform" }}
            >
              <path d="M18 15l-6-6-6 6" />
            </motion.svg>
          </motion.div>
          <motion.span
            className="text-[8px] tracking-[0.25em] uppercase text-text-secondary/35 transition-colors duration-300"
            animate={
              reduceMotion
                ? undefined
                : {
                    opacity: [0.35, 0.62, 0.35],
                  }
            }
            whileHover={
              liteMotion || reduceMotion
                ? undefined
                : {
                    opacity: 0.8,
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: liteMotion ? 3.2 : 3.6,
                    repeat: Infinity,
                    ease,
                  }
            }
          >
            {t("back_to_top")}
          </motion.span>
        </motion.button>

        {/* Copyright */}
        <div className="w-full border-t border-accent/[0.07] pt-5 flex items-center justify-center">
          <p className="text-[8px] md:text-[9px] tracking-[0.25em] uppercase text-text-secondary/28 text-center">
            &copy; {WEDDING_DATE.getFullYear()} &middot; {t("made_with_love")}
          </p>
        </div>
      </div>
    </footer>
  );
}
