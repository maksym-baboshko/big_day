"use client";

import { MOTION_EASE } from "@/shared/lib";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const STORAGE_KEY = "diandmax_splash_shown";

export function Splash() {
  const t = useTranslations("Splash");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(STORAGE_KEY);
    if (!alreadyShown) {
      setVisible(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }
  }, []);

  function dismiss() {
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: MOTION_EASE }}
          className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-bg-primary px-8"
          onClick={dismiss}
          aria-label={t("title")}
        >
          {/* Decorative top line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: MOTION_EASE }}
            className="mb-10 h-px w-32 origin-center bg-accent/40"
          />

          {/* Vibes title */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: MOTION_EASE }}
            className="mb-3 text-center text-5xl text-text-primary sm:text-6xl md:text-7xl"
            style={{ fontFamily: "var(--font-vibes), cursive" }}
          >
            {t("title")}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: MOTION_EASE }}
            className="font-cinzel mb-10 text-center text-sm uppercase tracking-[0.25em] text-text-secondary"
          >
            {t("subtitle")}
          </motion.p>

          {/* Decorative bottom line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: MOTION_EASE }}
            className="mb-8 h-px w-32 origin-center bg-accent/40"
          />

          {/* Tap hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="text-xs uppercase tracking-widest text-text-secondary"
          >
            tap to enter
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
