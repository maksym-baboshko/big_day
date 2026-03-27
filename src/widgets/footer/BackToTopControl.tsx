"use client";

import { MOTION_EASE, useLiteMotion } from "@/shared/lib";
import { motion, useReducedMotion } from "motion/react";

interface BackToTopControlProps {
  label: string;
}

export function BackToTopControl({ label }: BackToTopControlProps) {
  const liteMotion = useLiteMotion();
  const reduceMotion = useReducedMotion();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <motion.button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      className="group mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
      animate={
        reduceMotion
          ? undefined
          : {
              y: [0, liteMotion ? -3 : -4, 0],
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              duration: liteMotion ? 3.2 : 3.6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }
      }
      style={{ willChange: reduceMotion ? "auto" : "transform" }}
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, liteMotion ? 1.035 : 1.05, 1],
                borderColor: [
                  "rgba(var(--accent-rgb),0.34)",
                  "rgba(var(--accent-rgb),0.52)",
                  "rgba(var(--accent-rgb),0.34)",
                ],
                backgroundColor: [
                  "rgba(var(--accent-rgb),0)",
                  "rgba(var(--accent-rgb),0.08)",
                  "rgba(var(--accent-rgb),0)",
                ],
                color: [
                  "rgba(var(--accent-rgb),0.82)",
                  "rgba(var(--accent-rgb),1)",
                  "rgba(var(--accent-rgb),0.82)",
                ],
              }
        }
        whileHover={
          liteMotion || reduceMotion
            ? undefined
            : {
                scale: 1.06,
                backgroundColor: "rgba(var(--accent-rgb),0.1)",
                borderColor: "rgba(var(--accent-rgb),0.5)",
                color: "rgba(var(--accent-rgb),1)",
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: liteMotion ? 3.2 : 3.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: MOTION_EASE,
              }
        }
        className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/34 text-accent transition-all duration-500"
        style={{ willChange: reduceMotion ? "auto" : "transform, opacity" }}
      >
        <motion.svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={reduceMotion ? undefined : { y: [0, liteMotion ? -1 : -1.5, 0] }}
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: liteMotion ? 1.9 : 2.2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }
          }
          style={{ willChange: reduceMotion ? "auto" : "transform" }}
          aria-hidden="true"
        >
          <path d="M18 15l-6-6-6 6" />
        </motion.svg>
      </motion.div>
      <motion.span
        className="text-[8px] uppercase tracking-[0.25em] text-text-secondary/90 transition-colors duration-300"
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.88, 1, 0.88],
              }
        }
        whileHover={
          liteMotion || reduceMotion
            ? undefined
            : {
                opacity: 0.8,
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: liteMotion ? 3.2 : 3.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: MOTION_EASE,
              }
        }
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
