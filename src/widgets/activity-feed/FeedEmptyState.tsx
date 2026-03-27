"use client";

import { MOTION_EASE, cn } from "@/shared/lib";
import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { FeedStatePanel } from "./FeedStatePanel";

const CARD_DURATION = 18;
const EMPTY_STATE_FADE_DURATION = 0.9;

type GhostCardDef = {
  key: string;
  height: number;
  hasPrompt: boolean;
  promptLines: 2 | 3;
  hasAnswer: boolean;
  hasXp: boolean;
  delay: number;
};

type FrozenCardDef = {
  key: string;
  height: number;
  hasPrompt: boolean;
  promptLines: 2 | 3;
  hasAnswer: boolean;
  hasXp: boolean;
  top: number;
};

const FEED_EMPTY_STATE_HEADLINE_CLASS_NAME =
  "heading-serif text-[clamp(22px,4vw,48px)] tracking-[0.03em] text-text-primary";

const COL1: GhostCardDef[] = [
  {
    key: "col1-a",
    height: 168,
    hasPrompt: true,
    promptLines: 2,
    hasAnswer: true,
    hasXp: true,
    delay: 0,
  },
  {
    key: "col1-b",
    height: 92,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
    delay: 3.6,
  },
  {
    key: "col1-c",
    height: 178,
    hasPrompt: true,
    promptLines: 3,
    hasAnswer: true,
    hasXp: true,
    delay: 7.2,
  },
  {
    key: "col1-d",
    height: 92,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
    delay: 10.8,
  },
  {
    key: "col1-e",
    height: 160,
    hasPrompt: true,
    promptLines: 2,
    hasAnswer: false,
    hasXp: true,
    delay: 14.4,
  },
];

const COL_MOBILE: GhostCardDef[] = [
  {
    key: "mobile-a",
    height: 168,
    hasPrompt: true,
    promptLines: 2,
    hasAnswer: true,
    hasXp: true,
    delay: 0,
  },
  {
    key: "mobile-b",
    height: 92,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
    delay: 3.6,
  },
  {
    key: "mobile-c",
    height: 178,
    hasPrompt: true,
    promptLines: 3,
    hasAnswer: true,
    hasXp: true,
    delay: 7.2,
  },
  {
    key: "mobile-d",
    height: 92,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
    delay: 10.8,
  },
  {
    key: "mobile-e",
    height: 160,
    hasPrompt: true,
    promptLines: 2,
    hasAnswer: false,
    hasXp: true,
    delay: 14.4,
  },
];

const COL2: GhostCardDef[] = [
  {
    key: "col2-a",
    height: 92,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
    delay: 1.8,
  },
  {
    key: "col2-b",
    height: 178,
    hasPrompt: true,
    promptLines: 3,
    hasAnswer: true,
    hasXp: true,
    delay: 5.4,
  },
  {
    key: "col2-c",
    height: 92,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
    delay: 9,
  },
  {
    key: "col2-d",
    height: 168,
    hasPrompt: true,
    promptLines: 2,
    hasAnswer: true,
    hasXp: true,
    delay: 12.6,
  },
  {
    key: "col2-e",
    height: 92,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
    delay: 16.2,
  },
];

// Frozen card configs for the error state background — static positions, no animation
const FROZEN_COL1: FrozenCardDef[] = [
  {
    key: "fc1-a",
    height: 168,
    top: 24,
    hasPrompt: true,
    promptLines: 2,
    hasAnswer: true,
    hasXp: true,
  },
  {
    key: "fc1-b",
    height: 92,
    top: 230,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
  },
  {
    key: "fc1-c",
    height: 178,
    top: 358,
    hasPrompt: true,
    promptLines: 3,
    hasAnswer: true,
    hasXp: true,
  },
  {
    key: "fc1-d",
    height: 92,
    top: 572,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
  },
];

const FROZEN_COL2: FrozenCardDef[] = [
  {
    key: "fc2-a",
    height: 92,
    top: 68,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
  },
  {
    key: "fc2-b",
    height: 178,
    top: 196,
    hasPrompt: true,
    promptLines: 3,
    hasAnswer: true,
    hasXp: true,
  },
  {
    key: "fc2-c",
    height: 92,
    top: 424,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
  },
  {
    key: "fc2-d",
    height: 160,
    top: 548,
    hasPrompt: true,
    promptLines: 2,
    hasAnswer: false,
    hasXp: true,
  },
];

const FROZEN_MOBILE: FrozenCardDef[] = [
  {
    key: "fm-a",
    height: 168,
    top: 24,
    hasPrompt: true,
    promptLines: 2,
    hasAnswer: true,
    hasXp: true,
  },
  {
    key: "fm-b",
    height: 92,
    top: 230,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
  },
  {
    key: "fm-c",
    height: 178,
    top: 360,
    hasPrompt: true,
    promptLines: 3,
    hasAnswer: true,
    hasXp: true,
  },
  {
    key: "fm-d",
    height: 92,
    top: 578,
    hasPrompt: false,
    promptLines: 2,
    hasAnswer: false,
    hasXp: false,
  },
];

type GhostCardInnerProps = {
  hasPrompt: boolean;
  promptLines: 2 | 3;
  hasAnswer: boolean;
  hasXp: boolean;
};

function GhostCardInner({ hasPrompt, promptLines, hasAnswer, hasXp }: GhostCardInnerProps) {
  return (
    <>
      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-3xl bg-accent/22" />
      <div className="py-4 pl-7 pr-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-accent/10" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-24 rounded-full bg-accent/16" />
            <div className="h-1.5 w-40 rounded-full bg-accent/8" />
          </div>
          {hasXp ? (
            <div className="flex items-baseline gap-1">
              <div className="h-5 w-7 rounded bg-accent/14" />
              <div className="h-1.5 w-4 rounded-full bg-accent/8" />
            </div>
          ) : null}
        </div>

        {hasPrompt ? (
          <div className="mt-3 space-y-2">
            <div className="h-2 w-full rounded-full bg-accent/10" />
            <div className="h-2 w-5/6 rounded-full bg-accent/8" />
            {promptLines === 3 ? <div className="h-2 w-2/3 rounded-full bg-accent/7" /> : null}
          </div>
        ) : (
          <div className="mt-3">
            <div className="h-2 w-1/2 rounded-full bg-text-secondary/8" />
          </div>
        )}

        {hasAnswer ? (
          <div className="mt-4 rounded-2xl border border-accent/12 bg-accent/6 px-4 py-2.5">
            <div className="h-1.5 w-3/4 rounded-full bg-accent/10" />
          </div>
        ) : null}
      </div>
    </>
  );
}

function GhostCard({ height, hasPrompt, promptLines, hasAnswer, hasXp, delay }: GhostCardDef) {
  return (
    <div
      className="af-card-scroll absolute w-full overflow-hidden rounded-3xl border border-accent/10 bg-accent/5 backdrop-blur-[2px]"
      style={{
        height,
        bottom: -height,
        animationDuration: `${CARD_DURATION}s`,
        animationDelay: `-${delay}s`,
      }}
    >
      <GhostCardInner
        hasPrompt={hasPrompt}
        promptLines={promptLines}
        hasAnswer={hasAnswer}
        hasXp={hasXp}
      />
    </div>
  );
}

function StaticGhostCard({ height, top, hasPrompt, promptLines, hasAnswer, hasXp }: FrozenCardDef) {
  return (
    <div
      className="absolute w-full overflow-hidden rounded-3xl border border-accent/10 bg-accent/5 backdrop-blur-[2px]"
      style={{ height, top }}
    >
      <GhostCardInner
        hasPrompt={hasPrompt}
        promptLines={promptLines}
        hasAnswer={hasAnswer}
        hasXp={hasXp}
      />
    </div>
  );
}

interface FeedEmptyStateProps {
  variant: "loading" | "empty" | "error";
}

export function FeedEmptyState({ variant }: FeedEmptyStateProps) {
  const t = useTranslations("ActivityFeedPage");
  const isLoading = variant === "loading";
  const isError = variant === "error";

  return (
    <FeedStatePanel>
      <AnimatePresence initial={false}>
        {!isLoading ? (
          <motion.div
            key={isError ? "frozen-cards" : "ghost-cards"}
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: EMPTY_STATE_FADE_DURATION, ease: MOTION_EASE }}
          >
            {isError ? (
              // Frozen ghost cards — static positions, subtle drift animation, dimmed
              <div
                className="af-error-drift absolute inset-0 opacity-[0.13]"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                }}
              >
                {/* Mobile: single column */}
                <div className="relative h-full overflow-hidden px-3 lg:hidden">
                  {FROZEN_MOBILE.map(({ key, ...card }) => (
                    <StaticGhostCard key={key} {...card} />
                  ))}
                </div>
                {/* Desktop: two columns */}
                <div className="absolute inset-0 hidden gap-3 px-3 lg:flex">
                  <div className="relative flex-1 overflow-hidden">
                    {FROZEN_COL1.map(({ key, ...card }) => (
                      <StaticGhostCard key={key} {...card} />
                    ))}
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    {FROZEN_COL2.map(({ key, ...card }) => (
                      <StaticGhostCard key={key} {...card} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Animated scrolling ghost cards (empty state)
              <>
                <div
                  className="absolute inset-0 block lg:hidden"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                    maskImage:
                      "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                  }}
                >
                  <div className="relative h-full overflow-hidden px-3">
                    {COL_MOBILE.map(({ key, ...card }) => (
                      <GhostCard key={key} {...card} />
                    ))}
                  </div>
                </div>

                <div
                  className="absolute inset-0 hidden gap-3 px-3 lg:flex"
                  style={{
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                    maskImage:
                      "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                  }}
                >
                  <div className="relative flex-1 overflow-hidden">
                    {COL1.map(({ key, ...card }) => (
                      <GhostCard key={key} {...card} />
                    ))}
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    {COL2.map(({ key, ...card }) => (
                      <GhostCard key={key} {...card} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center">
        {/* ── Dot + LIVE — always in DOM, states cross-fade via opacity only ── */}
        <div className="flex items-center gap-4">
          {/* Dot */}
          <span className="relative flex h-3 w-3 shrink-0">
            {/* Active: pulsing accent (fades out on error) */}
            <span
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                isError ? "opacity-0" : "opacity-100",
              )}
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
            </span>
            {/* Error: dying heartbeat (fades in on error) */}
            <span
              className={cn(
                "af-error-dot absolute inline-flex h-3 w-3 rounded-full bg-text-secondary transition-opacity duration-700",
                isError ? "opacity-100" : "opacity-0",
              )}
            />
          </span>

          {/* LIVE text */}
          <div className="relative">
            {/* Active glitch — sets container size; fades out on error */}
            <div
              className={cn(
                "transition-opacity duration-700",
                isError ? "opacity-0" : "opacity-100",
              )}
            >
              <span
                aria-hidden="true"
                className="af-glitch-orange pointer-events-none absolute left-0 top-0 whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] lg:text-7xl"
                style={{ color: "rgba(255,155,80,0.75)" }}
              >
                LIVE
              </span>
              <span
                aria-hidden="true"
                className="af-glitch-cyan pointer-events-none absolute left-0 top-0 whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] lg:text-7xl"
                style={{ color: "rgba(90,210,255,0.65)" }}
              >
                LIVE
              </span>
              <span className="af-glitch-main relative whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] text-accent lg:text-7xl">
                LIVE
              </span>
            </div>

            {/* Frozen interference — absolutely overlaid; fades in on error */}
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                isError ? "opacity-100" : "opacity-0",
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] lg:text-7xl"
                style={{ color: "rgba(255,155,80,0.22)", transform: "translateX(-6px)" }}
              >
                LIVE
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] lg:text-7xl"
                style={{ color: "rgba(90,210,255,0.18)", transform: "translateX(6px)" }}
              >
                LIVE
              </span>
              <span className="af-error-signal relative whitespace-nowrap font-cinzel text-6xl tracking-[0.28em] text-text-secondary lg:text-7xl">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* ── Text grid — 3 overlapping slots, opacity cross-fade only.
            All slots share identical structure: icon-row + h3 + p.
            Loading/empty use an invisible placeholder the same size as WifiOff so
            the headline sits at the exact same y-position in every state. ── */}
        <div className="mt-10 grid w-full">
          {/* loading */}
          <div
            data-testid="live-feed-state-loading"
            aria-hidden={!isLoading}
            className={cn(
              "col-start-1 row-start-1 flex w-full flex-col items-center gap-5 transition-opacity duration-500",
              isLoading ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="h-7 w-7" aria-hidden="true" />
            <h3 className={FEED_EMPTY_STATE_HEADLINE_CLASS_NAME}>{t("feed_loading_headline")}</h3>
            <p className="min-h-10 max-w-[26rem] text-sm leading-relaxed text-text-secondary/80 lg:min-h-14 lg:text-base">
              {t("feed_loading_sub")}
            </p>
          </div>

          {/* empty */}
          <div
            data-testid="live-feed-state-empty"
            aria-hidden={isLoading || isError}
            className={cn(
              "col-start-1 row-start-1 flex w-full flex-col items-center gap-5 transition-opacity duration-[900ms]",
              !isLoading && !isError ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="h-7 w-7" aria-hidden="true" />
            <h3 className={FEED_EMPTY_STATE_HEADLINE_CLASS_NAME}>{t("feed_empty_headline")}</h3>
            <p className="min-h-10 max-w-[26rem] text-sm leading-relaxed text-text-secondary/80 lg:min-h-14 lg:text-base">
              {t("feed_empty_sub")}
            </p>
          </div>

          {/* error */}
          <div
            data-testid="live-feed-state-error"
            aria-hidden={!isError}
            className={cn(
              "col-start-1 row-start-1 flex w-full flex-col items-center gap-5 transition-opacity duration-700",
              isError ? "opacity-100" : "opacity-0",
            )}
          >
            <WifiOff
              className="af-error-icon text-text-secondary"
              size={28}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h3 className={cn(FEED_EMPTY_STATE_HEADLINE_CLASS_NAME, "text-text-primary/60")}>
              {t("feed_error_headline")}
            </h3>
            <p className="min-h-10 max-w-[26rem] text-sm leading-relaxed text-text-secondary/60 lg:min-h-14 lg:text-base">
              {t("feed_error_sub")}
            </p>
          </div>
        </div>
      </div>
    </FeedStatePanel>
  );
}
