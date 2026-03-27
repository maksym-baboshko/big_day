"use client";

import { MOTION_EASE, cn, useLiteMotion } from "@/shared/lib";
import { useLayoutEffect, useRef, useState } from "react";

import {
  type InViewRevealProps,
  buildThresholds,
  formatTranslate,
  getIntersectionRatio,
  getNavigationType,
  resolveRevealMotion,
} from "./reveal-shared";

export function InViewReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  threshold = 0.2,
  once = true,
  blur = false,
}: InViewRevealProps) {
  const liteMotion = useLiteMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(true);
  const [transitionsEnabled, setTransitionsEnabled] = useState(false);

  const motion = resolveRevealMotion(direction, liteMotion, duration, delay, blur);
  const normalizedThreshold = Math.min(Math.max(threshold, 0), 1);

  useLayoutEffect(() => {
    const node = containerRef.current;

    if (!node || typeof window === "undefined") {
      return;
    }

    const isHistoryRestore = getNavigationType() === "back_forward";
    const isInView = getIntersectionRatio(node) >= normalizedThreshold;

    let revealFrame = 0;

    if (isHistoryRestore) {
      setIsRevealed(isInView);

      const transitionFrame = window.requestAnimationFrame(() => {
        setTransitionsEnabled(true);
      });

      const observer = new IntersectionObserver(
        (entries) => {
          const nextEntry = entries[0];

          if (!nextEntry) {
            return;
          }

          const nextState =
            normalizedThreshold === 0
              ? nextEntry.isIntersecting
              : nextEntry.isIntersecting && nextEntry.intersectionRatio >= normalizedThreshold;

          setIsRevealed((previousState) => (once ? previousState || nextState : nextState));

          if (once && nextState) {
            observer.unobserve(node);
          }
        },
        { threshold: buildThresholds(normalizedThreshold) },
      );

      observer.observe(node);

      return () => {
        window.cancelAnimationFrame(transitionFrame);
        observer.disconnect();
      };
    }

    setIsRevealed(false);

    const transitionFrame = window.requestAnimationFrame(() => {
      setTransitionsEnabled(true);

      if (isInView) {
        revealFrame = window.requestAnimationFrame(() => {
          setIsRevealed(true);
        });
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const nextEntry = entries[0];

        if (!nextEntry) {
          return;
        }

        const nextState =
          normalizedThreshold === 0
            ? nextEntry.isIntersecting
            : nextEntry.isIntersecting && nextEntry.intersectionRatio >= normalizedThreshold;

        setIsRevealed((previousState) => (once ? previousState || nextState : nextState));

        if (once && nextState) {
          observer.unobserve(node);
        }
      },
      { threshold: buildThresholds(normalizedThreshold) },
    );

    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(transitionFrame);
      window.cancelAnimationFrame(revealFrame);
      observer.disconnect();
    };
  }, [normalizedThreshold, once]);

  return (
    <div
      ref={containerRef}
      className={cn(className)}
      style={{
        opacity: isRevealed ? 1 : 0.001,
        transform: isRevealed ? "none" : formatTranslate(motion.x, motion.y),
        transitionProperty: "transform, opacity",
        transitionDuration: transitionsEnabled ? `${motion.duration}s` : "0s",
        transitionDelay: transitionsEnabled && isRevealed ? `${motion.delay}s` : "0s",
        transitionTimingFunction: `cubic-bezier(${MOTION_EASE.join(", ")})`,
        ...(motion.backdropBlur && {
          backdropFilter: motion.backdropBlur,
          WebkitBackdropFilter: motion.backdropBlur,
        }),
        willChange: isRevealed ? undefined : "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
