"use client";

import { MOTION_EASE, cn, useLiteMotion } from "@/shared/lib";
import { useLayoutEffect, useState } from "react";

import {
  type RevealBaseProps,
  formatTranslate,
  getNavigationType,
  resolveRevealMotion,
} from "./reveal-shared";

export function PageEnterReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  blur = false,
}: RevealBaseProps) {
  const liteMotion = useLiteMotion();
  const [isRevealed, setIsRevealed] = useState(true);
  const [transitionsEnabled, setTransitionsEnabled] = useState(false);

  const motion = resolveRevealMotion(direction, liteMotion, duration, delay, blur);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (getNavigationType() === "back_forward") {
      const transitionFrame = window.requestAnimationFrame(() => {
        setTransitionsEnabled(true);
      });

      return () => {
        window.cancelAnimationFrame(transitionFrame);
      };
    }

    let revealFrame = 0;

    setIsRevealed(false);

    const transitionFrame = window.requestAnimationFrame(() => {
      setTransitionsEnabled(true);
      revealFrame = window.requestAnimationFrame(() => {
        setIsRevealed(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(transitionFrame);
      window.cancelAnimationFrame(revealFrame);
    };
  }, []);

  return (
    <div
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
