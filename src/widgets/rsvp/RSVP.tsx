"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { SectionWrapper, SectionHeading, AnimatedReveal, Input, Textarea } from "@/shared/ui";
import { cn, useLiteMotion } from "@/shared/lib";
import type { Guest } from "@/shared/config";

import { rsvpSchema, type RSVPFormData } from "@/widgets/rsvp/model";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

// ── Confetti colors ───────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#C9A96E", "#E8D5A3", "#F5E6C0", "#D4AF37",
  "#B8860B", "#FAF0DC", "#E4C97E", "#F0E0B0",
  "#C8A05E", "#EDD888", "#FFF3D4", "#A0782A",
];

// ── Full confetti (desktop) ───────────────────────────────────────────────────
const wave1 = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: 10 + ((i * 0.618033988) % 1) * 80,
  startY: -15 - Math.abs(Math.sin(i * 2)) * 30,
  delay: i * 0.007,
  duration: 3.0 + Math.abs(Math.sin(i * 1.1)) * 2.5,
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
    duration: 4.0 + Math.abs(Math.sin(j * 1.7)) * 3.5,
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

// ── Lite confetti (mobile) — sustained stream with later waves from the top ───
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

// ── Confetti overlay ──────────────────────────────────────────────────────────
function ConfettiOverlay({ onDone, lite }: { onDone: () => void; lite: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: lite ? 0.9 : 1.5, delay: lite ? 8.6 : 5.0 }}
      onAnimationComplete={() => setTimeout(onDone, 100)}
      className="fixed inset-0 z-220 overflow-hidden pointer-events-none"
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
                opacity: [piece.opacity, piece.opacity, piece.opacity * 0.9, piece.opacity * 0.35, 0, 0],
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

// ── Small helpers ─────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary/90">
      {children}
      {required && <span className="text-accent ml-1">*</span>}
    </p>
  );
}

function Divider() {
  return <div className="h-px bg-accent/16" />;
}

interface RSVPDefaultValues {
  guestNames: string[];
  guests: number;
  dietary: string;
  message: string;
  website: string;
}

function createDefaultFormValues(
  guest: Guest | undefined,
  locale: "uk" | "en"
): RSVPDefaultValues {
  return {
    guestNames: [guest?.formName?.[locale] ?? guest?.name[locale] ?? ""],
    guests: guest?.seats ?? 1,
    dietary: "",
    message: "",
    website: "",
  };
}

function RingIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none"
      className={cn("transition-all duration-500", active ? "text-accent" : "text-text-secondary/42")}
    >
      <circle cx="13" cy="13" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="13" r="4.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <path d="M8.5 13 Q13 7.5 17.5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function LeafIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none"
      className={cn("transition-all duration-500", active ? "text-text-primary" : "text-text-secondary/42")}
    >
      <circle cx="13" cy="13" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 13 L17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface RSVPProps {
  guest?: Guest;
}

export function RSVP({ guest }: RSVPProps) {
  const t = useTranslations("RSVP");
  const locale = useLocale() as "uk" | "en";
  const liteMotion = useLiteMotion();
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedAttending, setSubmittedAttending] = useState<RSVPFormData["attending"] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const maxGuestCount = guest?.seats ?? 10;
  const defaultFormValues = useMemo(
    () => createDefaultFormValues(guest, locale),
    [guest, locale]
  );
  const personalizedDefaultsKey = guest ? `${guest.slug}:${locale}` : null;
  const previousPersonalizedDefaultsRef = useRef<{
    key: string;
    values: RSVPDefaultValues;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: defaultFormValues,
  });

  const attending = watch("attending");
  const guests = watch("guests") ?? 1;
  const watchedGuestNames = watch("guestNames");
  const isAttendingYes = attending === "yes";
  const visibleGuestFieldsCount = attending === "yes" ? guests : 1;

  useEffect(() => {
    const currentGuestNames = watchedGuestNames?.length
      ? watchedGuestNames
      : [""];

    if (currentGuestNames.length === visibleGuestFieldsCount) {
      return;
    }

    if (currentGuestNames.length < visibleGuestFieldsCount) {
      setValue(
        "guestNames",
        [
          ...currentGuestNames,
          ...Array.from(
            { length: visibleGuestFieldsCount - currentGuestNames.length },
            () => ""
          ),
        ],
        { shouldDirty: true }
      );

      return;
    }

    setValue(
      "guestNames",
      currentGuestNames.slice(0, visibleGuestFieldsCount),
      { shouldDirty: true }
    );
  }, [setValue, visibleGuestFieldsCount, watchedGuestNames]);

  useEffect(() => {
    if (!guest || !personalizedDefaultsKey) {
      previousPersonalizedDefaultsRef.current = null;
      return;
    }

    if (submitted) {
      return;
    }

    const previousPersonalizedDefaults = previousPersonalizedDefaultsRef.current;

    if (!previousPersonalizedDefaults) {
      previousPersonalizedDefaultsRef.current = {
        key: personalizedDefaultsKey,
        values: defaultFormValues,
      };
      return;
    }

    if (previousPersonalizedDefaults.key === personalizedDefaultsKey) {
      return;
    }

    const currentNames = getValues("guestNames");
    const currentPrimaryGuest = currentNames?.[0] ?? "";
    const currentGuestCount = getValues("guests") ?? 1;

    const isUsingPreviousDefaults =
      currentPrimaryGuest === previousPersonalizedDefaults.values.guestNames[0] &&
      currentGuestCount === previousPersonalizedDefaults.values.guests &&
      !getValues("attending") &&
      !getValues("dietary") &&
      !getValues("message");

    if (isUsingPreviousDefaults) {
      reset(defaultFormValues);
    }

    previousPersonalizedDefaultsRef.current = {
      key: personalizedDefaultsKey,
      values: defaultFormValues,
    };
  }, [
    defaultFormValues,
    getValues,
    guest,
    personalizedDefaultsKey,
    reset,
    submitted,
  ]);

  const onSubmit = async (data: RSVPFormData) => {
    setSubmitError(null);

    if (guest && data.attending === "yes" && (data.guests ?? 1) > guest.seats) {
      setSubmitError(t("personalized_limit_error", { seats: guest.seats }));
      return;
    }

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "RSVP submission failed.");
      }

      const trimmedName = data.guestNames[0]?.trim() ?? "";
      const displayName = trimmedName.split(/\s+/)[0] ?? "";

      setSubmittedName(displayName);
      setSubmittedAttending(data.attending);
      reset(defaultFormValues);
      setShowConfetti(true);
      setSubmitted(true);
    } catch (error) {
      console.warn("RSVP submit error:", error);
      setSubmitError(
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : t("error_generic")
      );
    }
  };

  useEffect(() => {
    if (!submitted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [submitted]);

  // Stagger variants — defined inside component so liteMotion can influence delay
  const formStagger: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: liteMotion ? 0.18 : 0.45,
      },
    },
  };

  const formField: Variants = {
    hidden: { opacity: 0, y: liteMotion ? 14 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: liteMotion ? 0.4 : 0.55, ease },
    },
  };

  if (submitted) {
    return (
      <>
        <AnimatePresence>
          {showConfetti && (
            <ConfettiOverlay lite={liteMotion} onDone={() => setShowConfetti(false)} />
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
            transition={{ duration: liteMotion ? 0.5 : 0.75, ease }}
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
              transition={{ duration: 0.9, ease }}
              className="relative z-10 mb-8 flex justify-center text-accent"
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <motion.circle
                  cx="32" cy="32" r="28"
                  stroke="currentColor" strokeWidth="1.5"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, delay: 0.2, ease }}
                />
                <motion.path
                  d="M19 32 L28 41 L45 24"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.9, ease }}
                />
              </svg>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease }}
              className="relative z-10 mb-4 max-w-3xl heading-serif text-4xl text-text-primary md:max-w-none md:whitespace-nowrap md:text-6xl"
            >
              {submittedName
                ? t("success_title_named", { name: submittedName })
                : t("success_title")}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease }}
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
              onClick={() => {
                setSubmitted(false);
                setSubmittedAttending(null);
              }}
              className="relative z-10 cursor-pointer text-xs uppercase tracking-[0.18em] text-text-secondary/90 transition-colors duration-300 hover:text-accent md:text-sm"
            >
              ← {t("return_button")}
            </motion.button>
          </motion.div>
        </motion.div>
      </>
    );
  }

  return (
    <SectionWrapper id="rsvp" className="pt-12 pb-8 md:py-24 relative overflow-hidden">
      <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

      <div className="max-w-7xl mx-auto mt-12 md:mt-32 px-4 relative z-10 flex flex-col xl:flex-row items-center justify-center">
        <div className="w-full max-w-2xl shrink-0 relative py-12">

          {/* Photos — desktop only */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: 40, y: 40 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -top-4 -left-36 xl:-left-45 w-52 xl:w-60 z-0"
            >
              <div className="relative group">
                <div className="relative aspect-3/4 rounded-[2.5rem] overflow-hidden border border-accent/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-700 hover:scale-[1.05] hover:rotate-6 rotate-2">
                  <Image src="/images/rsvp/1.jpeg" alt="" fill sizes="(min-width: 1280px) 240px, 208px" loading="lazy" className="object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40, y: -40 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-8 -left-36 xl:-left-45 w-52 xl:w-60 z-10"
            >
              <div className="relative group">
                <div className="relative aspect-3/4 rounded-[2.5rem] overflow-hidden border border-accent/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-transform duration-700 hover:scale-[1.05] hover:-rotate-6 -rotate-2">
                  <Image src="/images/rsvp/2.jpeg" alt="" fill sizes="(min-width: 1280px) 240px, 208px" loading="lazy" className="object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -40, y: 40 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -top-4 -right-36 xl:-right-45 w-52 xl:w-60 z-0"
            >
              <div className="relative group">
                <div className="relative aspect-3/4 rounded-[2.5rem] overflow-hidden border border-accent/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-700 hover:scale-[1.05] hover:-rotate-6 -rotate-2">
                  <Image src="/images/rsvp/3.jpeg" alt="" fill sizes="(min-width: 1280px) 240px, 208px" loading="lazy" className="object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -40, y: -40 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-8 -right-36 xl:-right-45 w-52 xl:w-60 z-10"
            >
              <div className="relative group">
                <div className="relative aspect-3/4 rounded-[2.5rem] overflow-hidden border border-accent/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-700 hover:scale-[1.05] hover:rotate-6 rotate-2">
                  <Image src="/images/rsvp/4.jpeg" alt="" fill sizes="(min-width: 1280px) 240px, 208px" loading="lazy" className="object-cover object-[center_60%] grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Glass card */}
          <AnimatedReveal
            direction="up"
            duration={1.2}
            blur
            className="relative z-20 overflow-hidden rounded-4xl border border-accent/24 bg-bg-primary/72 shadow-[0_30px_100px_rgba(0,0,0,0.25)] md:rounded-[2.5rem] group/form"
          >
            <div className="pointer-events-none absolute inset-0 z-20 rounded-4xl border border-accent/0 transition-colors duration-500 group-hover/form:border-accent/40 md:rounded-[2.5rem]" />

            <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-12">
              {!liteMotion && (
                <>
                  <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
                  <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
                </>
              )}

              {/* Hidden field */}
              <input type="hidden" {...register("guests")} />
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="sr-only"
                {...register("website")}
              />

              {/* Staggered form fields */}
              <motion.div
                variants={formStagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.05 }}
                className="relative z-10 space-y-7 md:space-y-9"
              >
                {guest ? (
                  <>
                    <motion.div variants={formField}>
                      <div className="rounded-[1.75rem] border border-accent/22 bg-accent/12 px-5 py-4 text-left">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-accent">
                          {t("personalized_note_label")}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-text-secondary/90 md:text-[15px]">
                          {t("personalized_note", {
                            name: guest.vocative[locale],
                            seats: guest.seats,
                          })}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div variants={formField}><Divider /></motion.div>
                  </>
                ) : null}

                {/* ── Name ── */}
                <motion.div variants={formField}>
                  <FieldLabel required>
                    {visibleGuestFieldsCount > 1 ? t("guest_names_label") : t("name_label")}
                  </FieldLabel>
                  <div className="space-y-3">
                    {Array.from({ length: visibleGuestFieldsCount }, (_, index) => {
                      const fieldError = errors.guestNames?.[index];
                      const isPrimaryField = index === 0;

                      return (
                        <div key={`guest-name-${index}`}>
                          {visibleGuestFieldsCount > 1 && (
                            <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-text-secondary/90">
                              {t("guest_name_field_label", { number: index + 1 })}
                            </p>
                          )}
                          <Input
                            placeholder={
                              isPrimaryField
                                ? t("name_placeholder")
                                : t("guest_name_placeholder")
                            }
                            error={!!fieldError}
                            disabled={isSubmitting}
                            className="rounded-2xl py-4 text-base"
                            {...register(`guestNames.${index}`)}
                          />
                          {fieldError && (
                            <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-red-500/85">
                              {t("name_min")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {visibleGuestFieldsCount > 1 && (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.13em] text-text-secondary/90">
                      {t("guest_names_hint")}
                    </p>
                  )}
                  {errors.guestNames && !Array.isArray(errors.guestNames) && (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-red-500/85">
                      {t("guest_names_required")}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={formField}><Divider /></motion.div>

                {/* ── Attending ── */}
                <motion.div variants={formField}>
                  <FieldLabel>{t("attending_label")}</FieldLabel>
                  <div className="grid grid-cols-2 gap-3">

                    {/* YES */}
                    <motion.button
                      type="button"
                      disabled={isSubmitting}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setValue("attending", "yes", { shouldValidate: true })}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 md:py-8 transition-all duration-500 cursor-pointer overflow-hidden",
                        focusRingClass,
                        attending === "yes"
                          ? "border-accent bg-accent/12 shadow-[0_14px_38px_-30px_rgba(var(--accent-rgb),0.75)]"
                          : "border-accent/18 bg-bg-primary/72 hover:border-accent/40"
                      )}
                      aria-pressed={attending === "yes"}
                    >
                      <AnimatePresence>
                        {attending === "yes" && (
                          <motion.div
                            key="yes-glow"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-linear-to-b from-accent/12 to-transparent pointer-events-none"
                          />
                        )}
                      </AnimatePresence>
                      <RingIcon active={attending === "yes"} />
                      <span className={cn(
                        "heading-serif text-lg md:text-xl transition-colors duration-300",
                        attending === "yes" ? "text-accent" : "text-text-secondary/88"
                      )}>
                        {t("attending_yes_heading")}
                      </span>
                      <span className="text-center text-[9px] leading-tight uppercase tracking-[0.14em] text-text-secondary/90 md:text-[10px]">
                        {t("attending_yes_note")}
                      </span>
                    </motion.button>

                    {/* NO */}
                    <motion.button
                      type="button"
                      disabled={isSubmitting}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setValue("attending", "no", { shouldValidate: true })}
                      className={cn(
                        "relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-5 md:py-8 transition-all duration-500 cursor-pointer overflow-hidden",
                        focusRingClass,
                        attending === "no"
                          ? "border-text-secondary/48 bg-text-primary/8"
                          : "border-accent/18 bg-bg-primary/72 hover:border-accent/32"
                      )}
                      aria-pressed={attending === "no"}
                    >
                      <LeafIcon active={attending === "no"} />
                      <span className={cn(
                        "heading-serif text-lg md:text-xl transition-colors duration-300",
                        attending === "no" ? "text-text-primary" : "text-text-secondary/88"
                      )}>
                        {t("attending_no_heading")}
                      </span>
                      <span className="text-center text-[9px] leading-tight uppercase tracking-[0.14em] text-text-secondary/90 md:text-[10px]">
                        {t("attending_no_note")}
                      </span>
                    </motion.button>

                  </div>
                  {errors.attending && (
                    <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-red-500/85">{t("attendance_required")}</p>
                  )}
                </motion.div>

                {/* ── Conditional: guests + dietary ── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isAttendingYes ? "1fr" : "0fr",
                    transition: "grid-template-rows 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  aria-hidden={!isAttendingYes}
                  inert={!isAttendingYes}
                >
                  <div
                    className={cn(
                      "overflow-hidden",
                      !isAttendingYes && "pointer-events-none"
                    )}
                    style={{
                      opacity: isAttendingYes ? 1 : 0,
                      transition: `opacity ${isAttendingYes ? "0.4s 0.08s" : "0.25s 0s"} cubic-bezier(0.22, 1, 0.36, 1)`,
                    }}
                  >
                    <div className="space-y-7 md:space-y-9">
                      <Divider />

                      {/* Guest stepper */}
                      <div>
                        <FieldLabel>{t("guests_label")}</FieldLabel>
                        <div className="flex w-full items-center justify-between rounded-2xl border border-accent/22 bg-bg-primary/55 px-5 py-3">
                          <button
                            type="button"
                            disabled={!isAttendingYes || isSubmitting || guests <= 1}
                            onClick={() => setValue("guests", Math.max(1, guests - 1), { shouldValidate: true })}
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full border border-accent/32 text-xl leading-none transition-all duration-300",
                              focusRingClass,
                              !isAttendingYes || isSubmitting || guests <= 1
                                ? "cursor-not-allowed border-accent/18 bg-bg-secondary/35 text-accent/38"
                                : "cursor-pointer text-accent/85 hover:bg-accent/12 hover:border-accent hover:text-accent"
                            )}
                            aria-label="−"
                          >
                            −
                          </button>
                          <motion.span
                            key={guests}
                            initial={{ scale: 1.25, opacity: 0.6 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.22, ease }}
                            className="font-cinzel text-3xl text-accent select-none"
                          >
                            {guests}
                          </motion.span>
                          <button
                            type="button"
                            disabled={!isAttendingYes || isSubmitting || guests >= maxGuestCount}
                            onClick={() => setValue("guests", Math.min(maxGuestCount, guests + 1), { shouldValidate: true })}
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full border border-accent/32 text-xl leading-none transition-all duration-300",
                              focusRingClass,
                              !isAttendingYes || isSubmitting || guests >= maxGuestCount
                                ? "cursor-not-allowed border-accent/18 bg-bg-secondary/35 text-accent/38"
                                : "cursor-pointer text-accent/85 hover:bg-accent/12 hover:border-accent hover:text-accent"
                            )}
                            aria-label="+"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Dietary */}
                      <div>
                        <FieldLabel>{t("dietary_label")}</FieldLabel>
                        <Textarea
                          id="dietary"
                          placeholder={t("dietary_placeholder")}
                          disabled={!isAttendingYes || isSubmitting}
                          className="rounded-2xl text-sm min-h-24"
                          {...register("dietary")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div variants={formField}><Divider /></motion.div>

                {/* ── Message ── */}
                <motion.div variants={formField}>
                  <FieldLabel>{t("message_label")}</FieldLabel>
                  <Textarea
                    id="message"
                    placeholder={t("message_placeholder")}
                    disabled={isSubmitting}
                    className="rounded-2xl"
                    {...register("message")}
                  />
                </motion.div>

                {/* ── Submit ── */}
                <motion.div variants={formField} className="pt-1">
                  {submitError && (
                    <p className="mb-3 text-center text-[10px] uppercase tracking-[0.13em] text-red-500/90">
                      {submitError}
                    </p>
                  )}
                  <motion.button
                    type="submit"
                    disabled={!attending || isSubmitting}
                    whileHover={attending && !isSubmitting ? { scale: 1.01 } : {}}
                    whileTap={attending && !isSubmitting ? { scale: 0.99 } : {}}
                    className={cn(
                      "w-full py-4 md:py-5 rounded-2xl relative overflow-hidden font-medium text-base md:text-lg tracking-wide transition-all duration-500",
                      focusRingClass,
                      attending && !isSubmitting
                        ? "bg-accent text-bg-primary shadow-xl shadow-accent/20 cursor-pointer"
                        : "cursor-not-allowed border border-accent/22 bg-accent/22 text-text-primary/58"
                    )}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <span>{isSubmitting ? t("submit_loading") : t("submit")}</span>
                      {!isSubmitting && (
                        <motion.span
                          animate={attending ? { x: [0, 5, 0] } : {}}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          →
                        </motion.span>
                      )}
                    </span>
                    {/* Shimmer sweep on hover — desktop only */}
                    {attending && !isSubmitting && !liteMotion && (
                      <motion.div
                        initial={{ x: "-110%" }}
                        whileHover={{ x: "110%" }}
                        transition={{ duration: 0.55, ease }}
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-[-20deg] pointer-events-none"
                      />
                    )}
                  </motion.button>

                  <p className="mt-3 text-center text-[10px] uppercase tracking-[0.13em] text-text-secondary/90">
                    {!attending
                      ? t("attendance_required")
                      : isSubmitting
                        ? t("submit_loading_note")
                        : t("delivery_note")}
                  </p>
                </motion.div>

              </motion.div>
            </form>
          </AnimatedReveal>
        </div>
      </div>
    </SectionWrapper>
  );
}
