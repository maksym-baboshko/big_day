"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

const SEAL_BREAK_DELAY_SECONDS = 1;
const SEAL_BREAK_DURATION_SECONDS = 1.02;
const INVITATION_REVEAL_DELAY_SECONDS = 2;
const INVITATION_REVEAL_DURATION_SECONDS = 1.04;
const ENVELOPE_CLOSED_OFFSET = "-24%";
const LETTER_OPEN_OFFSET = "-65%";
const splashPaletteClassName = [
  "[--splash-paper-base:#EAE0CE]",
  "[--splash-paper-soft:#F6ECE2]",
  "[--splash-paper-left-start:#EEE0CC]",
  "[--splash-paper-left-end:#E0CEB8]",
  "[--splash-paper-right-start:#ECDDC8]",
  "[--splash-paper-right-end:#DECBB5]",
  "[--splash-paper-bottom-start:#E6D8C4]",
  "[--splash-paper-bottom-end:#DDD0BC]",
  "[--splash-paper-top-start:#F8F0E8]",
  "[--splash-paper-top-end:#EDE2D4]",
  "[--splash-paper-back:#C8B89E]",
  "[--splash-card:#FAF6F0]",
  "[--splash-card-border:#E6D5C3]",
  "[--splash-card-ink:#3A3530]",
  "[--splash-card-muted:#A08875]",
  "[--splash-card-accent:#C4A07A]",
  "[--splash-ornament:#A87848]",
  "dark:[--splash-paper-base:#E0D1C0]",
  "dark:[--splash-paper-soft:#ECDDCE]",
  "dark:[--splash-paper-left-start:#E3D2C1]",
  "dark:[--splash-paper-left-end:#D4BFA8]",
  "dark:[--splash-paper-right-start:#E1CFBE]",
  "dark:[--splash-paper-right-end:#D1BBA4]",
  "dark:[--splash-paper-bottom-start:#D8C8B4]",
  "dark:[--splash-paper-bottom-end:#CBB8A2]",
  "dark:[--splash-paper-top-start:#EDE0D2]",
  "dark:[--splash-paper-top-end:#E0CFBE]",
  "dark:[--splash-paper-back:#B7A58C]",
  "dark:[--splash-card:#F5EDE3]",
  "dark:[--splash-card-border:#DDCAB7]",
  "dark:[--splash-card-ink:#342F2A]",
  "dark:[--splash-card-muted:#9D856F]",
  "dark:[--splash-card-accent:#C49E75]",
  "dark:[--splash-ornament:#A97D53]",
].join(" ");

export function Splash() {
  const t = useTranslations("Splash");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("splashSeen");
    }

    return true;
  });
  const [flapZIndex, setFlapZIndex] = useState(40);

  useEffect(() => {
    if (!isClient || !showSplash) return;

    sessionStorage.setItem("splashSeen", "true");
    setFlapZIndex(40);

    const flapTimer = setTimeout(() => setFlapZIndex(15), 1950);
    const splashTimer = setTimeout(() => setShowSplash(false), 3500);

    return () => {
      clearTimeout(flapTimer);
      clearTimeout(splashTimer);
    };
  }, [isClient, showSplash]);

  if (!isClient) {
    return <div data-testid="splash-overlay" className="fixed inset-0 z-[100] bg-bg-primary" />;
  }

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          data-testid="splash-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          <motion.div
            className="absolute inset-0 bg-bg-primary backdrop-blur-md"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className={`${splashPaletteClassName} relative flex h-[28rem] w-96 max-w-[90vw] items-center justify-center md:h-[620px] md:w-[560px]`}
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.05, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ perspective: "900px" }}
          >
            <motion.div
              className="absolute inset-x-0 bottom-0 h-72 md:h-[420px]"
              initial={{ y: ENVELOPE_CLOSED_OFFSET }}
              animate={{ y: 0 }}
              transition={{
                y: {
                  duration: INVITATION_REVEAL_DURATION_SECONDS,
                  delay: INVITATION_REVEAL_DELAY_SECONDS,
                  ease: "easeInOut",
                },
              }}
            >
              <div
                className="absolute inset-0 z-0 rounded-sm shadow-xl"
                style={{ backgroundColor: "var(--splash-paper-base)" }}
              />

              <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
                <svg
                  className="h-full w-full"
                  viewBox="0 0 400 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect
                    x="11"
                    y="11"
                    width="378"
                    height="278"
                    stroke="var(--splash-card-accent)"
                    strokeWidth="0.7"
                    opacity="0.45"
                  />
                  <path
                    d="M11 42 L11 11 L42 11"
                    stroke="var(--splash-ornament)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                  <path
                    d="M358 11 L389 11 L389 42"
                    stroke="var(--splash-ornament)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                  <path
                    d="M11 258 L11 289 L42 289"
                    stroke="var(--splash-ornament)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                  <path
                    d="M358 289 L389 289 L389 258"
                    stroke="var(--splash-ornament)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                  <path
                    d="M11 11 L14.5 14.5 L11 18 L7.5 14.5 Z"
                    fill="var(--splash-ornament)"
                    opacity="0.6"
                  />
                  <path
                    d="M389 11 L392.5 14.5 L389 18 L385.5 14.5 Z"
                    fill="var(--splash-ornament)"
                    opacity="0.6"
                  />
                  <path
                    d="M11 289 L14.5 292.5 L11 296 L7.5 292.5 Z"
                    fill="var(--splash-ornament)"
                    opacity="0.6"
                  />
                  <path
                    d="M389 289 L392.5 292.5 L389 296 L385.5 292.5 Z"
                    fill="var(--splash-ornament)"
                    opacity="0.6"
                  />
                  <path
                    d="M200 11 L202.5 13.5 L200 16 L197.5 13.5 Z"
                    fill="var(--splash-ornament)"
                    opacity="0.4"
                  />
                  <path
                    d="M200 289 L202.5 291.5 L200 294 L197.5 291.5 Z"
                    fill="var(--splash-ornament)"
                    opacity="0.4"
                  />
                  <path
                    d="M11 150 L13.5 152.5 L11 155 L8.5 152.5 Z"
                    fill="var(--splash-ornament)"
                    opacity="0.4"
                  />
                  <path
                    d="M389 150 L391.5 152.5 L389 155 L386.5 152.5 Z"
                    fill="var(--splash-ornament)"
                    opacity="0.4"
                  />
                </svg>
              </div>

              <motion.div
                className="absolute z-20 flex h-[85%] w-[92%] flex-col items-center justify-center rounded-sm border p-6 text-center shadow-md"
                style={{
                  left: "4%",
                  top: "7%",
                  borderColor: "var(--splash-card-border)",
                  backgroundColor: "var(--splash-card)",
                }}
                initial={{ y: 0, scale: 0.99 }}
                animate={{ y: LETTER_OPEN_OFFSET, scale: 1 }}
                transition={{
                  y: {
                    duration: INVITATION_REVEAL_DURATION_SECONDS,
                    delay: INVITATION_REVEAL_DELAY_SECONDS,
                    ease: "easeInOut",
                  },
                  scale: {
                    duration: INVITATION_REVEAL_DURATION_SECONDS,
                    delay: INVITATION_REVEAL_DELAY_SECONDS,
                    ease: "easeInOut",
                  },
                }}
              >
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm">
                  <svg
                    className="h-full w-full"
                    viewBox="-2 -5 404 288"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <rect
                      x="12"
                      y="12"
                      width="376"
                      height="254"
                      stroke="var(--splash-card-accent)"
                      strokeWidth="0.65"
                      opacity="0.32"
                    />
                    <path
                      d="M12 12 C9 8 9 3 12 0 C15 3 15 8 12 12 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.45"
                    />
                    <path
                      d="M12 12 C7 9 4 5 7 3 C10 5 12 9 12 12 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.37"
                    />
                    <path
                      d="M12 12 C9 15 5 15 3 12 C5 9 9 9 12 12 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.30"
                    />
                    <path
                      d="M388 12 C385 8 385 3 388 0 C391 3 391 8 388 12 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.45"
                    />
                    <path
                      d="M388 12 C391 9 395 5 393 3 C390 5 388 9 388 12 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.37"
                    />
                    <path
                      d="M388 12 C391 15 395 15 397 12 C395 9 391 9 388 12 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.30"
                    />
                    <path
                      d="M12 266 C9 270 9 275 12 278 C15 275 15 270 12 266 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.45"
                    />
                    <path
                      d="M12 266 C7 269 4 273 7 275 C10 273 12 269 12 266 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.37"
                    />
                    <path
                      d="M12 266 C9 263 5 263 3 266 C5 269 9 269 12 266 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.30"
                    />
                    <path
                      d="M388 266 C385 270 385 275 388 278 C391 275 391 270 388 266 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.45"
                    />
                    <path
                      d="M388 266 C391 269 395 273 393 275 C390 273 388 269 388 266 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.37"
                    />
                    <path
                      d="M388 266 C391 263 395 263 397 266 C395 269 391 269 388 266 Z"
                      fill="var(--splash-ornament)"
                      opacity="0.30"
                    />
                  </svg>
                </div>

                <h1
                  className="heading-serif mb-3 text-3xl md:text-5xl"
                  style={{ color: "var(--splash-card-ink)" }}
                >
                  {t("title")}
                </h1>
                <div className="my-3 flex items-center justify-center">
                  <svg width="36" height="18" viewBox="0 0 36 18" fill="none" aria-hidden="true">
                    <circle
                      cx="12"
                      cy="9"
                      r="8"
                      stroke="var(--splash-card-accent)"
                      strokeWidth="1.3"
                      fill="none"
                      opacity="0.58"
                    />
                    <circle
                      cx="24"
                      cy="9"
                      r="8"
                      stroke="var(--splash-card-accent)"
                      strokeWidth="1.3"
                      fill="none"
                      opacity="0.58"
                    />
                  </svg>
                </div>
                <p
                  className="heading-serif-italic text-sm md:text-base"
                  style={{ color: "var(--splash-card-muted)" }}
                >
                  {t("subtitle")}
                </p>
              </motion.div>

              <motion.div
                className="pointer-events-none absolute inset-x-0 top-0 z-[35] h-1/2"
                style={{
                  backgroundColor: "var(--splash-paper-soft)",
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.1, delay: 0.9 }}
              />

              <div className="absolute inset-0 z-30 pointer-events-none">
                <svg
                  className="h-full w-full"
                  viewBox="0 0 400 300"
                  preserveAspectRatio="none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="leftFlap" x1="0" y1="0.5" x2="1" y2="0.5">
                      <stop offset="0%" stopColor="var(--splash-paper-left-start)" />
                      <stop offset="100%" stopColor="var(--splash-paper-left-end)" />
                    </linearGradient>
                    <linearGradient id="rightFlap" x1="1" y1="0.5" x2="0" y2="0.5">
                      <stop offset="0%" stopColor="var(--splash-paper-right-start)" />
                      <stop offset="100%" stopColor="var(--splash-paper-right-end)" />
                    </linearGradient>
                    <linearGradient id="bottomFlap" x1="0.5" y1="1" x2="0.5" y2="0">
                      <stop offset="0%" stopColor="var(--splash-paper-bottom-start)" />
                      <stop offset="100%" stopColor="var(--splash-paper-bottom-end)" />
                    </linearGradient>
                  </defs>
                  <path d="M0 0 L200 150 L0 300 Z" fill="url(#leftFlap)" />
                  <path d="M400 0 L200 150 L400 300 Z" fill="url(#rightFlap)" />
                  <path
                    d="M0 300 L200 150 L400 300 Z"
                    fill="url(#bottomFlap)"
                    filter="drop-shadow(0px -3px 5px rgba(0,0,0,0.06))"
                  />
                </svg>
              </div>

              <motion.div
                className="absolute inset-0 h-full w-full origin-top pointer-events-none"
                style={{ transformStyle: "preserve-3d", zIndex: flapZIndex }}
                initial={{ rotateX: 0 }}
                animate={{ rotateX: -180 }}
                transition={{
                  duration: 0.78,
                  delay: SEAL_BREAK_DELAY_SECONDS,
                  ease: "easeInOut",
                }}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                  <svg
                    className="h-full w-full"
                    viewBox="0 0 400 300"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="topFlapGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                        <stop offset="0%" stopColor="var(--splash-paper-top-start)" />
                        <stop offset="100%" stopColor="var(--splash-paper-top-end)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 0 L200 155 L400 0 Z"
                      fill="url(#topFlapGrad)"
                      filter="drop-shadow(0px 4px 5px rgba(0,0,0,0.07))"
                    />
                  </svg>
                </div>

                <div
                  className="absolute inset-0"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateX(180deg)",
                    clipPath: "polygon(0% 100%, 50% 48.3%, 100% 100%)",
                    backgroundColor: "var(--splash-paper-back)",
                    backgroundImage: [
                      "repeating-linear-gradient(45deg, rgba(255,245,220,0.13) 0px, rgba(255,245,220,0.13) 1px, transparent 1px, transparent 14px)",
                      "repeating-linear-gradient(-45deg, rgba(255,245,220,0.13) 0px, rgba(255,245,220,0.13) 1px, transparent 1px, transparent 14px)",
                    ].join(", "),
                  }}
                />
              </motion.div>

              <motion.div
                className="absolute left-1/2 top-[52%] flex h-[6.5rem] w-[6.5rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full z-50 md:h-32 md:w-32"
                style={{
                  background: "radial-gradient(circle at 38% 35%, #dfc285, #c49640 50%, #9a7228)",
                  boxShadow:
                    "0 8px 24px -4px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.15), inset 0 3px 8px rgba(255,245,210,0.35), inset 0 -3px 8px rgba(0,0,0,0.2)",
                }}
                initial={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                animate={{
                  scale: [1, 1, 0.9, 1.24],
                  opacity: [1, 1, 1, 0],
                  rotate: [0, 0, -3, 10],
                  y: [0, 0, 2, -8],
                }}
                transition={{
                  duration: SEAL_BREAK_DURATION_SECONDS,
                  times: [0, 0.64, 0.84, 1],
                  ease: "easeIn",
                }}
              >
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 100 100"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="50" cy="50" r="45" stroke="rgba(255,245,200,0.5)" strokeWidth="1" />
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    stroke="rgba(255,245,200,0.35)"
                    strokeWidth="0.8"
                  />
                  <path d="M50 7 L51.8 10 L50 13 L48.2 10 Z" fill="rgba(255,245,200,0.6)" />
                  <path d="M93 50 L90 51.8 L87 50 L90 48.2 Z" fill="rgba(255,245,200,0.6)" />
                  <path d="M50 93 L51.8 90 L50 87 L48.2 90 Z" fill="rgba(255,245,200,0.6)" />
                  <path d="M7 50 L10 51.8 L13 50 L10 48.2 Z" fill="rgba(255,245,200,0.6)" />
                </svg>

                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="h-px w-7 bg-[#f5e8c0]/65" />
                  <span className="font-serif text-xl font-bold italic tracking-widest text-[#faf4ea] drop-shadow md:text-2xl">
                    M&amp;D
                  </span>
                  <div className="h-px w-7 bg-[#f5e8c0]/65" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
