import { getTranslations } from "next-intl/server";

const FOOTER_SECTIONS = [
  { key: "story" as const, href: "#story" },
  { key: "timeline" as const, href: "#timeline" },
  { key: "location" as const, href: "#location" },
  { key: "dress_code" as const, href: "#dress-code" },
  { key: "gifts" as const, href: "#gifts" },
  { key: "rsvp" as const, href: "#rsvp" },
];

export async function Footer() {
  const t = await getTranslations("Footer");
  const tNav = await getTranslations("Navbar");

  return (
    <footer className="relative overflow-hidden bg-bg-secondary px-5 pt-20 pb-8 text-center">
      {/* Watermark monogram */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <span className="font-cinzel text-[18vw] font-bold leading-none text-accent/5 sm:text-[12vw]">
          M&D
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Logo */}
        <p
          className="mb-2 text-4xl text-text-primary"
          style={{ fontFamily: "var(--font-vibes), cursive" }}
        >
          Maksym & Diana
        </p>
        <p className="font-cinzel mb-10 text-xs uppercase tracking-[0.3em] text-text-secondary">
          28 · VI · 2026 · Bergen
        </p>

        {/* Nav links */}
        <nav aria-label={t("section_navigation")}>
          <ul className="mb-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {FOOTER_SECTIONS.map(({ key, href }) => (
              <li key={key}>
                <a
                  href={href}
                  className="font-cinzel text-xs uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
                >
                  {tNav(key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Divider */}
        <div className="mx-auto mb-8 h-px w-24 bg-accent/20" />

        {/* Tagline + back to top */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-text-secondary">{t("made_with_love")}</p>
          <a
            href="#hero"
            className="font-cinzel text-xs uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
          >
            {t("back_to_top")} ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
