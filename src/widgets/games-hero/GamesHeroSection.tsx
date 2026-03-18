"use client";

import { AnimatedReveal } from "@/shared/ui";
import { cn } from "@/shared/lib";

interface GamesHeroSectionProps {
  title: React.ReactNode;
  description: React.ReactNode;
  chips: readonly string[];
  rightSlot: React.ReactNode;
  eyebrow?: React.ReactNode;
  topSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  className?: string;
  gridClassName?: string;
  rightClassName?: string;
  leftDelay?: number;
  rightDelay?: number;
}

export function GamesHeroSection({
  title,
  description,
  chips,
  rightSlot,
  eyebrow,
  topSlot,
  bottomSlot,
  className,
  gridClassName,
  rightClassName,
  leftDelay = 0.04,
  rightDelay = 0.1,
}: GamesHeroSectionProps) {
  return (
    <div
      className={cn(
        "relative mx-auto max-w-6xl px-5 pb-6 pt-10 md:px-8 md:pb-8 md:pt-16",
        className
      )}
    >
      {topSlot}

      <div
        className={cn(
          "grid items-end gap-8 lg:grid-cols-[1fr_440px] lg:gap-10",
          topSlot && "mt-8",
          gridClassName
        )}
      >
        <AnimatedReveal direction="up" delay={leftDelay}>
          <div className="flex h-full flex-col lg:min-h-[285px]">
            <div>
              {eyebrow ? (
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-accent/60" />
                  <p className="text-[10px] uppercase tracking-[0.38em] text-accent">
                    {eyebrow}
                  </p>
                </div>
              ) : null}

              <h1
                className={cn(
                  "heading-serif max-w-xl text-4xl leading-[0.96] text-text-primary md:text-5xl lg:text-6xl",
                  eyebrow && "mt-4"
                )}
              >
                {title}
              </h1>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-text-secondary md:text-base">
                {description}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 lg:mt-auto">
              {chips.map((chip, index) => (
                <span
                  key={`${index}-${chip}`}
                  className="rounded-full border border-accent/14 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] text-text-secondary"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </AnimatedReveal>

        <AnimatedReveal
          direction="up"
          delay={rightDelay}
          className={rightClassName}
        >
          {rightSlot}
        </AnimatedReveal>
      </div>

      {bottomSlot ? <div className="mt-6">{bottomSlot}</div> : null}
    </div>
  );
}
