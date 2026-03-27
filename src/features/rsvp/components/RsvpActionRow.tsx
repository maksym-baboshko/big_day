"use client";

import { MOTION_EASE, cn } from "@/shared/lib";
import { motion } from "motion/react";

interface RsvpActionRowProps {
  disabled: boolean;
  isSubmitting: boolean;
  liteMotion: boolean;
  submitLabel: string;
  loadingLabel: string;
  statusMessage: string;
  errorMessage?: string | null;
}

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

export function RsvpActionRow({
  disabled,
  isSubmitting,
  liteMotion,
  submitLabel,
  loadingLabel,
  statusMessage,
  errorMessage,
}: RsvpActionRowProps) {
  return (
    <div className="pt-1">
      {errorMessage ? (
        <p
          id="rsvp-submit-error"
          role="alert"
          className="mb-3 text-center text-[10px] uppercase tracking-[0.13em] text-error/90"
        >
          {errorMessage}
        </p>
      ) : null}
      <motion.button
        type="submit"
        disabled={disabled || isSubmitting}
        whileHover={!disabled && !isSubmitting ? { scale: 1.01 } : undefined}
        whileTap={!disabled && !isSubmitting ? { scale: 0.99 } : undefined}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl py-4 text-base font-medium tracking-wide transition-all duration-500 md:py-5 md:text-lg",
          focusRingClass,
          !disabled && !isSubmitting
            ? "cursor-pointer bg-accent text-bg-primary shadow-xl shadow-accent/20"
            : "cursor-not-allowed border border-accent/22 bg-accent/22 text-text-primary/58",
        )}
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          <span>{isSubmitting ? loadingLabel : submitLabel}</span>
          {!isSubmitting ? (
            <motion.span
              animate={!disabled ? { x: [0, 5, 0] } : undefined}
              transition={{
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              →
            </motion.span>
          ) : null}
        </span>
        {!disabled && !isSubmitting && !liteMotion ? (
          <motion.div
            initial={{ x: "-110%" }}
            whileHover={{ x: "110%" }}
            transition={{ duration: 0.55, ease: MOTION_EASE }}
            className="pointer-events-none absolute inset-0 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/15 to-transparent"
          />
        ) : null}
      </motion.button>

      <p
        aria-live="polite"
        aria-atomic="true"
        role={isSubmitting ? "status" : undefined}
        className="mt-3 text-center text-[10px] uppercase tracking-[0.13em] text-text-secondary/90"
      >
        {statusMessage}
      </p>
    </div>
  );
}
