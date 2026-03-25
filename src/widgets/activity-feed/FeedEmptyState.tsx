"use client";

import { cn } from "@/shared/lib";
import { useTranslations } from "next-intl";

const CARD_DURATION_S = 18;
const CARDS_PER_COL = 5;
const CARD_DELAY_STEP = CARD_DURATION_S / CARDS_PER_COL;

// Heights in px (must match card render height)
const CARD_HEIGHT = 140;
const CARD_GAP = 12;
const CARD_STEP = CARD_HEIGHT + CARD_GAP;

function GhostCard({
  index,
  columnOffset,
  wide,
}: {
  index: number;
  columnOffset: number;
  wide?: boolean;
}) {
  const delay = columnOffset + index * CARD_DELAY_STEP;
  return (
    <div
      className={cn(
        "live-feed-card-scroll absolute left-0 right-0 rounded-3xl border border-accent/8 bg-bg-secondary/20 px-5 py-4",
        wide && "border-accent/12 bg-accent/5",
      )}
      style={{
        height: CARD_HEIGHT,
        bottom: -CARD_HEIGHT - index * CARD_STEP,
        animationDuration: `${CARD_DURATION_S}s`,
        animationDelay: `-${delay}s`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-accent/10" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3 w-28 rounded-full bg-accent/10" />
          <div className="h-2.5 w-16 rounded-full bg-accent/8" />
        </div>
      </div>
      {wide && <div className="mt-3 h-3 w-3/4 rounded-full bg-accent/8" />}
    </div>
  );
}

interface FeedEmptyStateProps {
  variant: "loading" | "empty";
}

export function FeedEmptyState({ variant }: FeedEmptyStateProps) {
  const t = useTranslations("LivePage");

  return (
    <div className="relative flex h-[520px] w-full overflow-hidden rounded-4xl">
      {/* Ghost card columns (hidden while loading) */}
      {variant === "empty" && (
        <>
          {/* Desktop left column */}
          <div className="absolute inset-y-0 left-0 right-[calc(50%+6px)] hidden overflow-hidden lg:block">
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
              }}
            >
              {([0, 1, 2, 3, 4] as const).map((i) => (
                <GhostCard key={i} index={i} columnOffset={0} />
              ))}
            </div>
          </div>
          {/* Desktop right column */}
          <div className="absolute inset-y-0 left-[calc(50%+6px)] right-0 hidden overflow-hidden lg:block">
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
              }}
            >
              {([0, 1, 2, 3, 4] as const).map((i) => (
                <GhostCard key={i} index={i} columnOffset={1.8} wide />
              ))}
            </div>
          </div>
          {/* Mobile single column */}
          <div className="absolute inset-y-0 inset-x-0 overflow-hidden lg:hidden">
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 9%, black 88%, transparent 100%)",
              }}
            >
              {([0, 1, 2, 3, 4] as const).map((i) => (
                <GhostCard key={i} index={i} columnOffset={0} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Central overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-bg-primary/70 backdrop-blur-sm">
        {/* Glitch LIVE text */}
        <div className="relative select-none">
          {/* Orange glitch layer */}
          <span
            className="live-feed-live-glitch-orange font-cinzel pointer-events-none absolute inset-0 text-7xl font-black tracking-[0.25em] text-orange-400/80"
            aria-hidden="true"
          >
            LIVE
          </span>
          {/* Cyan glitch layer */}
          <span
            className="live-feed-live-glitch-cyan font-cinzel pointer-events-none absolute inset-0 text-7xl font-black tracking-[0.25em] text-cyan-400/65"
            aria-hidden="true"
          >
            LIVE
          </span>
          {/* Main text */}
          <span className="live-feed-live-glitch-main font-cinzel relative text-7xl font-black tracking-[0.25em] text-accent">
            LIVE
          </span>
        </div>

        {/* Text */}
        {variant === "loading" ? (
          <div className="text-center">
            <p className="text-base font-semibold text-text-primary">
              {t("feed_loading_headline")}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{t("feed_loading_sub")}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-base font-semibold text-text-primary">{t("feed_empty_headline")}</p>
            <p className="mt-1 max-w-xs text-sm text-text-secondary">{t("feed_empty_sub")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
