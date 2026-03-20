"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { RSVPFormData } from "./model";
import { cn, MOTION_EASE } from "@/shared/lib";
import { ConfettiOverlay } from "./ConfettiOverlay";

interface RsvpSuccessOverlayProps {
  liteMotion: boolean;
  showConfetti: boolean;
  submittedName: string;
  submittedAttending: RSVPFormData["attending"] | null;
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

  return (
    <>
      <AnimatePresence>
        {showConfetti && (
          <ConfettiOverlay lite={liteMotion} onDone={onHideConfetti} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-180"
      >
        <motion.div
          initial={{ opacity: 0, y: liteMotion ? 18 : 28, scale: liteMotion ? 0.98 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: liteMotion ? 0.5 : 0.75, ease: MOTION_EASE }}
          className={cn(
            "relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-bg-primary px-8 py-16 text-center md:px-10 md:py-20",
            !liteMotion && "backdrop-blur-md"
          )}
        >
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 bg-bg-primary/92",
              !liteMotion && "backdrop-blur-md"
            )}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-accent/8 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-accent/7 to-transparent" />
          {!liteMotion && (
            <>
              <div className="pointer-events-none absolute top-[12%] right-[12%] h-64 w-64 rounded-full bg-accent/10 blur-[110px]" />
              <div className="pointer-events-none absolute bottom-[10%] left-[10%] h-72 w-72 rounded-full bg-accent/9 blur-[120px]" />
            </>
          )}

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: MOTION_EASE }}
            className="relative z-10 mb-8 flex justify-center text-accent"
          >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: MOTION_EASE }}
            className="relative z-10 mb-4 max-w-3xl heading-serif text-4xl text-text-primary md:max-w-none md:whitespace-nowrap md:text-6xl"
          >
            {submittedName
              ? t("success_title_named", { name: submittedName })
              : t("success_title")}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: MOTION_EASE }}
            className="relative z-10 mb-10 max-w-2xl text-base leading-relaxed text-text-secondary/90 md:text-xl"
          >
            {submittedAttending === "no"
              ? t("success_subtitle_no")
              : t("success_subtitle_yes")}
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            onClick={onDismiss}
            className="relative z-10 cursor-pointer text-xs uppercase tracking-[0.18em] text-text-secondary/90 transition-colors duration-300 hover:text-accent md:text-sm"
          >
            ← {t("return_button")}
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}
