"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MOTION_EASE, cn } from "@/shared/lib";
import type { RsvpFormData } from "../schema/rsvp-schema";
import { ConfettiOverlay } from "./ConfettiOverlay";

interface RsvpSuccessOverlayProps {
  liteMotion: boolean;
  showConfetti: boolean;
  submittedName: string;
  submittedAttending: RsvpFormData["attending"] | null;
  onHideConfetti: () => void;
  onDismiss: () => void;
}

export function RsvpSuccessOverlay({
  liteMotion,
  showConfetti,
  submittedName,
  submittedAttending,
  onHideConfetti,
  onDismiss,
}: RsvpSuccessOverlayProps) {
  const t = useTranslations("RSVP");
  const titleId = "rsvp-success-title";
  const descriptionId = "rsvp-success-description";
  const [isClosing, setIsClosing] = useState(false);
  const hasDismissedRef = useRef(false);

  if (typeof document === "undefined") {
    return null;
  }

  function handleAnimationComplete() {
    if (!isClosing || hasDismissedRef.current) {
      return;
    }

    hasDismissedRef.current = true;
    onDismiss();
  }

  return createPortal(
    <>
      <AnimatePresence>
        {showConfetti && <ConfettiOverlay lite={liteMotion} onDone={onHideConfetti} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        transition={{ duration: isClosing ? 0.28 : liteMotion ? 0.14 : 0.18 }}
        onAnimationComplete={handleAnimationComplete}
        className="fixed inset-0 z-[300]"
      >
        <dialog
          open
          className="fixed inset-0 m-0 h-screen w-screen max-h-none max-w-none overflow-hidden border-none bg-transparent p-0"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <motion.div
            initial={{ opacity: 0, y: liteMotion ? 18 : 28, scale: liteMotion ? 0.98 : 0.96 }}
            animate={
              isClosing
                ? { opacity: 0, y: liteMotion ? -10 : -18, scale: liteMotion ? 1 : 1.02 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{
              duration: isClosing ? 0.24 : liteMotion ? 0.5 : 0.75,
              ease: MOTION_EASE,
            }}
            className={cn(
              "relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-bg-primary px-8 py-16 text-center md:px-10 md:py-20",
              !liteMotion && "backdrop-blur-md",
            )}
          >
            <div
              aria-hidden="true"
              className={cn("absolute inset-0 bg-bg-primary/92", !liteMotion && "backdrop-blur-md")}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-accent/8 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-accent/7 to-transparent" />
            {!liteMotion && (
              <>
                <div className="pointer-events-none absolute right-[12%] top-[12%] h-64 w-64 rounded-full bg-accent/10 blur-[110px]" />
                <div className="pointer-events-none absolute bottom-[10%] left-[10%] h-72 w-72 rounded-full bg-accent/9 blur-[120px]" />
              </>
            )}

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, ease: MOTION_EASE }}
              className="relative z-10 mb-8 flex justify-center text-accent"
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.2, ease: MOTION_EASE }}
                />
                <motion.path
                  d="M19 32 L28 41 L45 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.9, ease: MOTION_EASE }}
                />
              </svg>
            </motion.div>
            <motion.h3
              id={titleId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: MOTION_EASE }}
              className="heading-serif relative z-10 mb-4 max-w-3xl text-4xl text-text-primary md:max-w-none md:whitespace-nowrap md:text-6xl"
            >
              {submittedName
                ? t("success_title_named", { name: submittedName })
                : t("success_title")}
            </motion.h3>
            <motion.p
              id={descriptionId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: MOTION_EASE }}
              className="relative z-10 mb-10 max-w-2xl text-base leading-relaxed text-text-secondary/90 md:text-xl"
              aria-live="polite"
              aria-atomic="true"
            >
              {submittedAttending === "no" ? t("success_subtitle_no") : t("success_subtitle_yes")}
            </motion.p>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: isClosing ? 0 : 1 }}
              transition={{ delay: isClosing ? 0 : 1.1, duration: isClosing ? 0.16 : undefined }}
              onClick={() => setIsClosing(true)}
              disabled={isClosing}
              className="relative z-10 cursor-pointer text-xs uppercase tracking-[0.18em] text-text-secondary/90 transition-colors duration-300 hover:text-accent md:text-sm"
            >
              ← {t("return_button")}
            </motion.button>
          </motion.div>
        </dialog>
      </motion.div>
    </>,
    document.body,
  );
}
