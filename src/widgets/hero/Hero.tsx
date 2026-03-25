import { Countdown } from "@/features/countdown";
import { VENUE, WEDDING_DATE_ROMAN } from "@/shared/config";
import { AnimatedReveal, Ornament } from "@/shared/ui";
import { getTranslations } from "next-intl/server";

export async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg-primary px-5 py-24 text-center"
    >
      <Ornament position="top-left" size="lg" className="opacity-30" />
      <Ornament position="top-right" size="lg" className="opacity-30" />

      <AnimatedReveal direction="up" delay={0.1}>
        <h1
          className="mb-4 text-5xl leading-tight text-text-primary sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ fontFamily: "var(--font-vibes), cursive" }}
        >
          {t("title")}
        </h1>
      </AnimatedReveal>

      <AnimatedReveal direction="up" delay={0.25}>
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px w-16 bg-accent/40" />
          <span className="text-lg text-accent">✦</span>
          <div className="h-px w-16 bg-accent/40" />
        </div>
      </AnimatedReveal>

      <AnimatedReveal direction="up" delay={0.35}>
        <p className="font-cinzel mb-2 text-sm tracking-[0.3em] text-accent md:text-base">
          {WEDDING_DATE_ROMAN}
        </p>
      </AnimatedReveal>

      <AnimatedReveal direction="up" delay={0.45}>
        <p className="font-cinzel mb-12 text-xs uppercase tracking-widest text-text-secondary">
          {VENUE.name} · {VENUE.locationShort}
        </p>
      </AnimatedReveal>

      <AnimatedReveal direction="up" delay={0.55}>
        <Countdown className="mb-12" />
      </AnimatedReveal>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="font-cinzel text-[10px] uppercase tracking-[0.2em] text-text-secondary opacity-60">
          {t("scroll_down")}
        </p>
        <div className="h-10 w-px animate-bounce bg-accent/40" />
      </div>
    </section>
  );
}
