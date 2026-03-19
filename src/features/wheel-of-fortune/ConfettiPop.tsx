"use client";

import { motion } from "framer-motion";
import { SEGMENT_PALETTE } from "./wheel-helpers";

export function ConfettiPop({ trigger }: { trigger: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const dist = 60 + ((trigger + i * 17) % 40);
        return (
          <motion.div
            key={`${trigger}-${i}`}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.2, 0.6],
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
            }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute h-2 w-2 rounded-full"
            style={{
              background: SEGMENT_PALETTE[i % SEGMENT_PALETTE.length],
            }}
          />
        );
      })}
    </div>
  );
}
