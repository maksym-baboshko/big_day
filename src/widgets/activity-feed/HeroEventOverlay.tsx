"use client";

import type { Locale } from "@/shared/i18n/routing";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { EASE } from "./activity-feed-helpers";
import { getAvatarMonogram, getEventPrompt, getHeroLabelKey } from "./activity-feed-helpers";
import type { LiveFeedEventSnapshot } from "./types";

function SonarRing({ scale, delay }: { scale: number; delay: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-full border border-accent/30"
      initial={{ scale: 1, opacity: 0 }}
      animate={{ scale, opacity: [0, 0.5, 0] }}
      transition={{
        duration: 2.4,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeOut",
      }}
    />
  );
}

function XpCounter({ target }: { target: number }) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const duration = 1200;
    const start = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // cubic ease-out
      const eased = 1 - (1 - progress) ** 3;
      el.textContent = String(Math.round(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return <span ref={spanRef}>0</span>;
}

interface HeroEventOverlayProps {
  heroEvent: LiveFeedEventSnapshot;
  locale: Locale;
  totalPoints?: number;
}

export function HeroEventOverlay({ heroEvent, locale, totalPoints }: HeroEventOverlayProps) {
  const t = useTranslations("LivePage");
  const monogram = getAvatarMonogram(heroEvent.avatarKey, heroEvent.playerName);
  const labelKey = getHeroLabelKey(heroEvent.type);
  const prompt = getEventPrompt(heroEvent, locale);
  const answer = heroEvent.answerI18n?.[locale] ?? heroEvent.answerI18n?.uk ?? null;
  const playerName = heroEvent.playerName ?? t("anonymous_player");
  const isNewTopPlayer = heroEvent.type === "new_top_player";
  const isWheelEvent = heroEvent.type === "promised" || heroEvent.type === "answered";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg-primary/[0.93]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: EASE } }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Ambient background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, color-mix(in srgb, var(--accent) 15%, transparent), transparent)",
        }}
        animate={{ opacity: [0.45, 0.85, 0.45] }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      {/* Drifting secondary gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 45% at 80% 20%, color-mix(in srgb, var(--accent) 9%, transparent), transparent)",
        }}
        animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }}
        transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />

      {/* Top half — avatar */}
      <div className="relative flex flex-1 flex-col items-center justify-end pb-8">
        <div
          className="relative flex items-center justify-center"
          style={{ width: "min(11rem, 22vh)", height: "min(11rem, 22vh)" }}
        >
          {/* Sonar rings */}
          <SonarRing scale={2.2} delay={0} />
          <SonarRing scale={2.85} delay={0.6} />
          <SonarRing scale={3.5} delay={1.2} />
          {/* Avatar circle */}
          <motion.div
            className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-accent/40 bg-accent/10 font-cinzel font-bold text-accent shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            style={{ fontSize: "min(2.5rem, 6vh)" }}
          >
            {monogram}
            {/* pulsing inner ring */}
            <motion.div
              className="pointer-events-none absolute inset-2 rounded-full border border-accent/30"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom half — text */}
      <div className="relative flex flex-1 flex-col items-center justify-start gap-4 px-6 pt-8 text-center">
        {/* Player name */}
        <motion.p
          className="heading-serif max-w-[90vw] font-bold text-text-primary"
          style={{ fontSize: "clamp(3rem, min(14vw, 13vh), 9.5rem)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
        >
          {playerName}
        </motion.p>

        {/* New top player */}
        {isNewTopPlayer && totalPoints != null && (
          <motion.div
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease: EASE }}
          >
            <p className="text-sm text-text-secondary">{t("new_top_player_note")}</p>
            <p className="font-cinzel text-4xl font-bold text-accent">
              <XpCounter target={totalPoints} /> XP
            </p>
          </motion.div>
        )}

        {/* Wheel/promise event */}
        {isWheelEvent && (
          <motion.div
            className="flex max-w-lg flex-col items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3, ease: EASE }}
          >
            {prompt && <p className="text-lg text-text-secondary">{prompt}</p>}
            {answer && (
              <p className="rounded-2xl border border-accent/25 bg-accent/8 px-5 py-3 text-xl italic text-text-primary">
                {answer}
              </p>
            )}
            {heroEvent.xpDelta != null && heroEvent.xpDelta > 0 && (
              <span className="font-cinzel rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-lg font-bold text-accent">
                +{heroEvent.xpDelta} XP
              </span>
            )}
          </motion.div>
        )}

        {/* Bottom label */}
        <motion.p
          className="font-cinzel absolute text-xs tracking-[0.45em] text-accent/60"
          style={{ bottom: "3vh" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
        >
          {t(labelKey as Parameters<ReturnType<typeof useTranslations>>[0])}
        </motion.p>
      </div>
    </motion.div>
  );
}
