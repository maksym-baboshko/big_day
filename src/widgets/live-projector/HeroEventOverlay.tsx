"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { LiveFeedEventSnapshot } from "@/features/game-session";
import type { SupportedLocale } from "@/shared/config";
import { EASE, getAvatarMonogram, getEventPrompt, getHeroLabelKey } from "./live-projector-helpers";

function SonarRing({ delay, finalScale }: { delay: number; finalScale: number }) {
  return (
    <motion.span
      className="absolute inset-0 rounded-full border border-accent/30"
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale: finalScale, opacity: [0, 0.5, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

function XpCounter({ value, delay = 0 }: { value: number; delay?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let raf: number;
    const startTimer = window.setTimeout(() => {
      const duration = 1200;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [value, delay]);

  return <>{count}</>;
}

export function HeroEventOverlay({
  heroEvent,
  locale,
  totalPoints,
}: {
  heroEvent: LiveFeedEventSnapshot;
  locale: SupportedLocale;
  totalPoints?: number;
}) {
  const t = useTranslations("LivePage");
  const isTopPlayer = heroEvent.eventType === "leaderboard.new_top_player";
  const isWheelEvent =
    heroEvent.eventType === "wheel.round.completed" ||
    heroEvent.eventType === "wheel.round.promised";
  const prompt = getEventPrompt(heroEvent, locale);

  // Prevent body scroll while overlay is visible
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed inset-0 z-20 flex flex-col overflow-hidden"
      style={{ backgroundColor: "rgba(5, 7, 12, 0.91)" }}
    >
      {/* Breathing ambient glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 50%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 68%)",
        }}
      />

      {/* Slow-drifting secondary gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ scale: [1, 1.1, 1], rotate: [0, 9, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 42% 32% at 22% 78%, color-mix(in srgb, var(--accent) 5%, transparent), transparent)",
        }}
      />

      {/* Top zone: avatar (50vh) */}
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 22, mass: 0.9, delay: 0.1 }}
          className="relative flex items-center justify-center"
        >
          <div
            className="relative"
            style={{ width: "min(11rem, 22vh)", height: "min(11rem, 22vh)" }}
          >
            <SonarRing delay={0} finalScale={2.2} />
            <SonarRing delay={0.95} finalScale={2.85} />
            <SonarRing delay={1.9} finalScale={3.5} />

            <div
              className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10 font-cinzel tracking-[0.18em] text-accent shadow-[0_0_100px_-4px_color-mix(in_srgb,var(--accent)_55%,transparent),inset_0_0_60px_-16px_color-mix(in_srgb,var(--accent)_24%,transparent)]"
              style={{ fontSize: "min(1.875rem, 4vh)" }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border border-accent/22"
                animate={{ opacity: [0.25, 0.85, 0.25] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative z-10">
                {getAvatarMonogram(heroEvent.avatarKey, heroEvent.playerName)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom zone: name + content (50vh) */}
      <div
        className="relative flex flex-1 flex-col items-center justify-start px-12"
        style={{ paddingTop: "3vh", paddingBottom: "5vh", gap: "4vh" }}
      >
        {/* Name */}
        <motion.h2
          initial={{ opacity: 0, scale: 1.14, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.22, ease: EASE }}
          className="heading-serif text-center leading-[0.88] text-text-primary"
          style={{ fontSize: "clamp(3rem, min(14vw, 13vh), 9.5rem)" }}
        >
          {heroEvent.playerName ?? t("anonymous_player")}
        </motion.h2>

        {/* Top-player: subtitle + total XP */}
        {isTopPlayer ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.52, ease: EASE }}
            className="flex flex-col items-center text-center"
            style={{ gap: "3vh" }}
          >
            <p className="max-w-xl text-xl leading-relaxed text-text-secondary/65 md:text-2xl">
              {t("new_top_player_note")}
            </p>

            {totalPoints != null ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.72, ease: EASE }}
                className="flex items-baseline gap-5"
              >
                <span
                  className="font-cinzel leading-none text-accent"
                  style={{ fontSize: "clamp(2.5rem, min(11vw, 9vh), 7.5rem)" }}
                >
                  <XpCounter value={totalPoints} delay={720} />
                </span>
                <span className="font-cinzel text-3xl uppercase tracking-[0.3em] text-text-secondary/45">
                  XP
                </span>
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}

        {/* Wheel event: question + answer + XP badge */}
        {isWheelEvent ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.52, ease: EASE }}
            className="flex flex-col items-center text-center"
            style={{ gap: "2vh" }}
          >
            {prompt ? (
              <p className="max-w-2xl text-lg leading-relaxed text-text-primary/72 md:text-xl">
                {prompt}
              </p>
            ) : null}
            {heroEvent.answerText ? (
              <p className="heading-serif-italic max-w-xl text-xl leading-snug text-text-primary/55 md:text-2xl">
                — {heroEvent.answerText}
              </p>
            ) : null}
            {heroEvent.xpDelta ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.82, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.74, ease: EASE }}
                className="flex items-center gap-3 rounded-full border border-accent/28 bg-accent/8 px-8 py-3"
              >
                <span className="font-cinzel text-xl text-accent">
                  +<XpCounter value={heroEvent.xpDelta} delay={740} />
                </span>
                <span className="font-cinzel text-[10px] uppercase tracking-[0.3em] text-text-secondary/45">
                  XP
                </span>
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}

        {/* Label — pinned to the bottom of the overlay */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.65, ease: EASE }}
          className="absolute font-cinzel text-xs uppercase tracking-[0.45em] text-accent/60"
          style={{ bottom: "3vh" }}
        >
          {t(getHeroLabelKey(heroEvent.eventType))}
        </motion.p>
      </div>
    </motion.div>
  );
}
