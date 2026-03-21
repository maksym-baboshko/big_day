"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// Equal duration + evenly distributed delays = gapless conveyor belt per column.
// 18s ÷ 5 cards = 3.6s between each.
const CARD_DURATION = 18;

// Glitch timing: 3.1s calm + 0.84s burst = 3.94s cycle.
const GLITCH_DURATION = 3.94;
const GLITCH_TIMES = [0, 0.787, 0.822, 0.857, 0.893, 0.929, 0.964, 1.0];
const glitchT = { duration: GLITCH_DURATION, repeat: Infinity, ease: "linear" as const, times: GLITCH_TIMES };

type GhostCardDef = {
  height: number;
  hasPrompt: boolean;
  promptLines: 2 | 3;
  hasAnswer: boolean;
  hasXp: boolean;
  delay: number;
};

// Column 1 — starts immediately; alternates full ↔ compact
const COL1: GhostCardDef[] = [
  { height: 168, hasPrompt: true,  promptLines: 2, hasAnswer: true,  hasXp: true,  delay: 0    },
  { height: 92,  hasPrompt: false, promptLines: 2, hasAnswer: false, hasXp: false, delay: 3.6  },
  { height: 178, hasPrompt: true,  promptLines: 3, hasAnswer: true,  hasXp: true,  delay: 7.2  },
  { height: 92,  hasPrompt: false, promptLines: 2, hasAnswer: false, hasXp: false, delay: 10.8 },
  { height: 160, hasPrompt: true,  promptLines: 2, hasAnswer: false, hasXp: true,  delay: 14.4 },
];

// Mobile — single column, same interval as COL1
const COL_MOBILE: GhostCardDef[] = [
  { height: 168, hasPrompt: true,  promptLines: 2, hasAnswer: true,  hasXp: true,  delay: 0    },
  { height: 92,  hasPrompt: false, promptLines: 2, hasAnswer: false, hasXp: false, delay: 3.6  },
  { height: 178, hasPrompt: true,  promptLines: 3, hasAnswer: true,  hasXp: true,  delay: 7.2  },
  { height: 92,  hasPrompt: false, promptLines: 2, hasAnswer: false, hasXp: false, delay: 10.8 },
  { height: 160, hasPrompt: true,  promptLines: 2, hasAnswer: false, hasXp: true,  delay: 14.4 },
];

// Column 2 — offset by half-interval (1.8s) so the two columns interleave
const COL2: GhostCardDef[] = [
  { height: 92,  hasPrompt: false, promptLines: 2, hasAnswer: false, hasXp: false, delay: 1.8  },
  { height: 178, hasPrompt: true,  promptLines: 3, hasAnswer: true,  hasXp: true,  delay: 5.4  },
  { height: 92,  hasPrompt: false, promptLines: 2, hasAnswer: false, hasXp: false, delay: 9.0  },
  { height: 168, hasPrompt: true,  promptLines: 2, hasAnswer: true,  hasXp: true,  delay: 12.6 },
  { height: 92,  hasPrompt: false, promptLines: 2, hasAnswer: false, hasXp: false, delay: 16.2 },
];

function GhostCard({ height, hasPrompt, promptLines, hasAnswer, hasXp, delay }: GhostCardDef) {
  return (
    <motion.div
      className="absolute w-full overflow-hidden rounded-3xl border border-accent/10 bg-accent/5 backdrop-blur-[2px]"
      style={{ height, bottom: -height }}
      animate={{ y: [0, -1900] }}
      transition={{ duration: CARD_DURATION, delay, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-3xl bg-accent/22" />
      <div className="py-4 pl-7 pr-5">
        {/* Header: avatar + name/meta + optional xp */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-accent/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-24 rounded-full bg-accent/16" />
            <div className="h-1.5 w-40 rounded-full bg-accent/8" />
          </div>
          {hasXp && (
            <div className="flex items-baseline gap-1">
              <div className="h-5 w-7 rounded bg-accent/14" />
              <div className="h-1.5 w-4 rounded-full bg-accent/8" />
            </div>
          )}
        </div>

        {/* Prompt lines or compact body line */}
        {hasPrompt ? (
          <div className="mt-3 space-y-2">
            <div className="h-2 w-full rounded-full bg-accent/10" />
            <div className="h-2 w-5/6 rounded-full bg-accent/8" />
            {promptLines === 3 && <div className="h-2 w-2/3 rounded-full bg-accent/7" />}
          </div>
        ) : (
          <div className="mt-3">
            <div className="h-2 w-1/2 rounded-full bg-text-secondary/8" />
          </div>
        )}

        {/* Answer bubble */}
        {hasAnswer && (
          <div className="mt-4 rounded-2xl border border-accent/12 bg-accent/6 px-4 py-2.5">
            <div className="h-1.5 w-3/4 rounded-full bg-accent/10" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function FeedEmptyState() {
  const t = useTranslations("LivePage");

  return (
    <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-accent/20 bg-bg-secondary/30 px-8 py-16 text-center lg:min-h-0 lg:flex-1">

      {/* Ghost cards — single column, mobile only */}
      <div
        className="pointer-events-none absolute inset-0 block lg:hidden"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
          maskImage:        "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
        }}
      >
        <div className="relative h-full overflow-hidden px-3">
          {COL_MOBILE.map((card, i) => <GhostCard key={i} {...card} />)}
        </div>
      </div>

      {/* Ghost cards — 2 columns, desktop only */}
      <div
        className="pointer-events-none absolute inset-0 hidden gap-3 px-3 lg:flex"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
          maskImage:        "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
        }}
      >
        <div className="relative flex-1 overflow-hidden">
          {COL1.map((card, i) => <GhostCard key={i} {...card} />)}
        </div>
        <div className="relative flex-1 overflow-hidden">
          {COL2.map((card, i) => <GhostCard key={i} {...card} />)}
        </div>
      </div>

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* LIVE badge */}
        <div className="relative mb-10 flex items-center justify-center">
          <div className="relative flex items-center gap-4">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
            </span>
            <div className="relative">
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] lg:text-7xl"
                style={{ color: "rgba(255,155,80,0.75)" }}
                animate={{ x: [0, 0, -7, 5, -5, 7, -2, 0], opacity: [0, 0, 0.9, 0, 0.9, 0, 0.6, 0] }}
                transition={glitchT}
              >LIVE</motion.span>
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] lg:text-7xl"
                style={{ color: "rgba(90,210,255,0.65)" }}
                animate={{ x: [0, 0, 7, -5, 5, -7, 2, 0], opacity: [0, 0, 0.75, 0, 0.75, 0, 0.5, 0] }}
                transition={glitchT}
              >LIVE</motion.span>
              <motion.span
                className="relative whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] text-accent lg:text-7xl"
                animate={{ x: [0, 0, 3, -3, 3, -3, 1, 0], skewX: [0, 0, -2, 1.5, -1.5, 2, 0, 0] }}
                transition={glitchT}
                style={{ textShadow: "0 0 48px color-mix(in srgb, var(--accent) 55%, transparent)" }}
              >LIVE</motion.span>
            </div>
          </div>
        </div>

        <h3 className="heading-serif mb-4 text-3xl text-text-primary lg:mb-8 lg:text-5xl">
          {t("feed_empty_headline")}
        </h3>
        <p className="max-w-[26rem] text-sm leading-relaxed text-text-secondary/80 lg:text-lg">
          {t("feed_empty_sub")}
        </p>
      </div>
    </div>
  );
}
