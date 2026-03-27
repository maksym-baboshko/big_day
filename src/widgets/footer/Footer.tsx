"use client";

import { VENUE, WEDDING_DATE, WEDDING_DATE_ROMAN } from "@/shared/config";
import { useTranslations } from "next-intl";
import { BackToTopControl } from "./BackToTopControl";
import { FooterNavCluster } from "./FooterNavCluster";
import { FooterSignatureBlock } from "./FooterSignatureBlock";

export function Footer() {
  const t = useTranslations("Footer");
  const tHero = useTranslations("Hero");
  const tNavbar = useTranslations("Navbar");

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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-linear-to-b from-bg-primary to-transparent md:h-32"
      />

      <div className="relative z-20 mt-12 md:mt-28">
        <hr className="gold-rule" />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none"
      >
        <span className="font-vibes text-[55vw] leading-none whitespace-nowrap text-accent/4.5 md:hidden -translate-x-[10%]">
          М &amp; Д
        </span>
        <span className="font-vibes hidden text-[26vw] leading-none whitespace-nowrap text-accent/4.5 md:inline -translate-x-[8%] translate-y-[12%]">
          {tHero("groom_name")} &amp; {tHero("bride_name")}
        </span>
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-10 px-6 pb-10 pt-10 md:pt-32">
        <FooterSignatureBlock
          venueLabel={VENUE.locationShort}
          groomName={tHero("groom_name")}
          brideName={tHero("bride_name")}
          romanDate={WEDDING_DATE_ROMAN}
          venueName={VENUE.name}
        />

        <FooterNavCluster items={navLinks} ariaLabel={t("section_navigation")} />

        <BackToTopControl label={t("back_to_top")} />

        <div className="flex w-full items-center justify-center border-t border-accent/[0.12] pt-5">
          <p className="text-center text-[8px] uppercase tracking-[0.25em] text-text-secondary/90 md:text-[9px]">
            &copy; {WEDDING_DATE.getFullYear()} &middot; {t("made_with_love")}
          </p>
        </div>
      </div>
    </footer>
  );
}
