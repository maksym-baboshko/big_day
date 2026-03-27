"use client";

import { motion } from "motion/react";

const CONFETTI_COLORS = [
  "#C9A96E",
  "#E8D5A3",
  "#F5E6C0",
  "#D4AF37",
  "#B8860B",
  "#FAF0DC",
  "#E4C97E",
  "#F0E0B0",
  "#C8A05E",
  "#EDD888",
  "#FFF3D4",
  "#A0782A",
] as const;

const wave1 = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: 10 + ((i * 0.618033988) % 1) * 80,
  startY: -15 - Math.abs(Math.sin(i * 2)) * 30,
  delay: i * 0.007,
  duration: 3 + Math.abs(Math.sin(i * 1.1)) * 2.5,
  rotate: Math.cos(i * 1.2) * 1080,
  swayX: Math.sin(i * 0.9) * 340,
  width: 8 + Math.abs(Math.sin(i * 2.3)) * 16,
  height: 3 + Math.abs(Math.cos(i * 1.7)) * 8,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  opacity: 0.85 + Math.abs(Math.sin(i * 0.5)) * 0.15,
}));

const wave2 = Array.from({ length: 160 }, (_, i) => {
  const j = i + 100;

  return {
    id: j,
    x: ((i * 0.618033988) % 1) * 100,
    startY: -25 - Math.abs(Math.sin(j * 0.7)) * 120,
    delay: 0.05 + (i % 20) * 0.09,
    duration: 4 + Math.abs(Math.sin(j * 1.7)) * 3.5,
    rotate: Math.cos(j * 0.8) * 800,
    swayX: Math.sin(j * 1.3) * 280,
    width: 4 + Math.abs(Math.sin(j * 2.1)) * 20,
    height: 2 + Math.abs(Math.cos(j * 1.9)) * 8,
    color: CONFETTI_COLORS[j % CONFETTI_COLORS.length],
    opacity: 0.65 + Math.abs(Math.sin(j * 0.5)) * 0.35,
  };
});

const wave3 = Array.from({ length: 80 }, (_, i) => {
  const j = i + 260;

  return {
    id: j,
    x: ((i * 0.618033988) % 1) * 100,
    startY: -8,
    delay: 0.4 + i * 0.028,
    duration: 5.5 + Math.abs(Math.sin(j * 1.3)) * 3,
    rotate: Math.cos(j * 0.5) * 540,
    swayX: Math.sin(j * 0.7) * 460,
    width: 9 + Math.abs(Math.sin(j * 1.8)) * 13,
    height: 4 + Math.abs(Math.cos(j * 2.2)) * 5,
    color: CONFETTI_COLORS[j % CONFETTI_COLORS.length],
    opacity: 0.55 + Math.abs(Math.sin(j * 0.5)) * 0.4,
  };
});

const confettiPieces = [...wave1, ...wave2, ...wave3];

const liteConfettiPieces = Array.from({ length: 180 }, (_, i) => ({
  id: i + 5000,
  x: ((i * 0.618033988) % 1) * 100,
  startY: -(18 + (i % 14) * 16),
  delay: (i % 60) * 0.05,
  duration: 4.4 + (i % 10) * 0.18,
  midSwayX: (i % 2 === 0 ? 1 : -1) * (4 + (i % 6) * 2),
  swayX: (i % 2 === 0 ? 1 : -1) * (10 + (i % 8) * 3),
  rotate: (i % 2 === 0 ? 1 : -1) * (110 + (i % 7) * 32),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  width: 2 + (i % 5) * 1.8,
  height: 2 + (i % 3),
  opacity: 0.72 + (i % 4) * 0.06,
  radius: i % 4 === 0 ? 999 : 1.5,
}));

interface ConfettiOverlayProps {
  lite: boolean;
  onDone: () => void;
}

export function ConfettiOverlay({ lite, onDone }: ConfettiOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: lite ? 0.9 : 1.5, delay: lite ? 8.6 : 5 }}
      onAnimationComplete={() => setTimeout(onDone, 100)}
      className="pointer-events-none fixed inset-0 z-[320] overflow-hidden"
    >
      {lite
        ? liteConfettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ y: piece.startY, x: 0, rotate: 0, opacity: 0 }}
              animate={{
                y: "118vh",
                x: [0, piece.midSwayX, piece.swayX],
                rotate: [0, piece.rotate * 0.45, piece.rotate],
                opacity: [0, piece.opacity, piece.opacity * 0.92, piece.opacity * 0.35, 0, 0],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: [0.12, 0.32, 0.85, 1],
                times: [0, 0.08, 0.5, 0.66, 0.78, 1],
              }}
              style={{
                position: "absolute",
                left: `${piece.x}%`,
                top: 0,
                width: piece.width,
                height: piece.height,
                backgroundColor: piece.color,
                borderRadius: piece.radius,
                willChange: "transform, opacity",
              }}
            />
          ))
        : confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ y: piece.startY, x: 0, rotate: 0, opacity: piece.opacity }}
              animate={{
                y: "122vh",
                x: [0, piece.swayX * 0.2, piece.swayX * 0.6, piece.swayX],
                rotate: piece.rotate,
                opacity: [
                  piece.opacity,
                  piece.opacity,
                  piece.opacity * 0.9,
                  piece.opacity * 0.35,
                  0,
                  0,
                ],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: [0.08, 0.3, 0.85, 1],
                times: [0, 0.45, 0.62, 0.74, 0.84, 1],
              }}
              style={{
                position: "absolute",
                left: `${piece.x}%`,
                top: 0,
                width: piece.width,
                height: piece.height,
                backgroundColor: piece.color,
                borderRadius: 2,
              }}
            />
          ))}
    </motion.div>
  );
}
