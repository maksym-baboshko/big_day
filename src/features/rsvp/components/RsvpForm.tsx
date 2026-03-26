"use client";

import { MOTION_EASE, useLiteMotion } from "@/shared/lib";
import { AnimatedReveal } from "@/shared/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Variants, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { type DefaultValues, type FieldErrors, useForm } from "react-hook-form";

import { submitRsvp } from "../actions/submit-rsvp";
import { rsvpSchema } from "../schema/rsvp-schema";
import type { RsvpFormData } from "../schema/rsvp-schema";
import {
  RsvpAttendanceSection,
  RsvpAttendingDetailsSection,
  RsvpDivider,
  RsvpGuestNamesSection,
  RsvpMessageSection,
  RsvpPersonalizedNoteSection,
  RsvpPhotoCluster,
  RsvpSubmitSection,
} from "./RsvpFormSections";
import { RsvpSuccessOverlay } from "./RsvpSuccessOverlay";

interface RsvpFormProps {
  slug?: string;
  guestVocative?: string;
  maxSeats?: number;
  initialGuestName?: string;
}

export function RsvpForm({ slug, guestVocative, maxSeats, initialGuestName }: RsvpFormProps) {
  const t = useTranslations("RSVP");
  const liteMotion = useLiteMotion();
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedAttending, setSubmittedAttending] = useState<RsvpFormData["attending"] | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const guestNameKeyCounterRef = useRef(1);
  const guestFieldToFocusRef = useRef<number | null>(null);
  const [guestNameKeys, setGuestNameKeys] = useState<string[]>(["guest-name-0"]);
  const defaultValues = useMemo<DefaultValues<RsvpFormData>>(
    () => ({
      attending: undefined,
      guests: maxSeats ?? 1,
      guestNames: [initialGuestName ?? ""],
      dietary: "",
      message: "",
      website: "",
      slug,
    }),
    [initialGuestName, maxSeats, slug],
  );

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    watch,
    setValue,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues,
  });

  const attendingChoice = watch("attending");
  const guestsValue = watch("guests") ?? 1;
  const guestNames = watch("guestNames") ?? [""];
  const visibleGuestFieldsCount = attendingChoice === "yes" ? guestsValue : 1;
  const hasAttemptedSubmit = submitCount > 0;

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
      transition: { duration: liteMotion ? 0.4 : 0.55, ease: MOTION_EASE },
    },
  };
  const translateSection = (
    key: string,
    values?: Record<string, string | number | null | undefined>,
  ) => t(key, values as Record<string, string | number | Date> | undefined);

  useEffect(() => {
    const normalizedCurrent = guestNames.length > 0 ? guestNames : [""];
    const updated =
      visibleGuestFieldsCount > normalizedCurrent.length
        ? [
            ...normalizedCurrent,
            ...Array<string>(visibleGuestFieldsCount - normalizedCurrent.length).fill(""),
          ]
        : normalizedCurrent.slice(0, visibleGuestFieldsCount);

    const didChange =
      updated.length !== normalizedCurrent.length ||
      updated.some((value, index) => value !== normalizedCurrent[index]);

    if (didChange) {
      setValue("guestNames", updated, { shouldValidate: hasAttemptedSubmit });
    }
  }, [guestNames, hasAttemptedSubmit, setValue, visibleGuestFieldsCount]);

  useEffect(() => {
    setGuestNameKeys((currentKeys) => {
      if (visibleGuestFieldsCount === currentKeys.length) {
        return currentKeys;
      }

      if (visibleGuestFieldsCount < currentKeys.length) {
        return currentKeys.slice(0, visibleGuestFieldsCount);
      }

      const nextKeys = [...currentKeys];

      while (nextKeys.length < visibleGuestFieldsCount) {
        nextKeys.push(`guest-name-${guestNameKeyCounterRef.current}`);
        guestNameKeyCounterRef.current += 1;
      }

      return nextKeys;
    });
  }, [visibleGuestFieldsCount]);

  useEffect(() => {
    if (
      guestFieldToFocusRef.current == null ||
      attendingChoice !== "yes" ||
      visibleGuestFieldsCount <= guestFieldToFocusRef.current
    ) {
      return;
    }

    const guestFieldIndex = guestFieldToFocusRef.current;
    guestFieldToFocusRef.current = null;
    const frameId = window.requestAnimationFrame(() => {
      setFocus(`guestNames.${guestFieldIndex}`);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [attendingChoice, setFocus, visibleGuestFieldsCount]);

  function handleGuestsChange(newCount: number) {
    if (maxSeats && newCount > maxSeats) return;
    const clamped = Math.max(1, Math.min(maxSeats ?? 20, newCount));
    const current = guestNames.length;
    const updated =
      clamped > current
        ? [...guestNames, ...Array<string>(clamped - current).fill("")]
        : guestNames.slice(0, clamped);
    setValue("guests", clamped, { shouldValidate: hasAttemptedSubmit });
    setValue("guestNames", updated, { shouldValidate: hasAttemptedSubmit });
  }

  function handleAttendingChange(value: RsvpFormData["attending"]) {
    setValue("attending", value, { shouldValidate: hasAttemptedSubmit });

    if (value !== "yes" || !guestVocative) {
      guestFieldToFocusRef.current = null;
      return;
    }

    guestFieldToFocusRef.current = (maxSeats ?? 1) > 1 ? 1 : 0;
  }

  function handleInvalidSubmit(formErrors: FieldErrors<RsvpFormData>) {
    if (Array.isArray(formErrors.guestNames)) {
      const firstInvalidGuestIndex = formErrors.guestNames.findIndex(Boolean);

      if (firstInvalidGuestIndex >= 0) {
        setFocus(`guestNames.${firstInvalidGuestIndex}`);
        return;
      }
    }

    if (formErrors.guestNames) {
      setFocus("guestNames.0");
      return;
    }

    if (formErrors.dietary) {
      setFocus("dietary");
      return;
    }

    if (formErrors.message) {
      setFocus("message");
    }
  }

  function getSubmittedDisplayName(names: string[]) {
    const submittedFullName = names.find((name) => name.trim().length > 0)?.trim();

    if (!submittedFullName) {
      return guestVocative ?? "";
    }

    return submittedFullName.split(/\s+/)[0] ?? guestVocative ?? "";
  }

  async function onSubmit(data: RsvpFormData) {
    setSubmitError(null);

    if (maxSeats && data.attending === "yes" && (data.guests ?? 1) > maxSeats) {
      setSubmitError(t("personalized_limit_error", { seats: maxSeats }));
      return;
    }

    const result = await submitRsvp(data);

    if (result.success) {
      setSubmittedName(getSubmittedDisplayName(data.guestNames));
      setSubmittedAttending(data.attending);
      reset(defaultValues);
      setShowConfetti(true);
      setSubmitted(true);
    } else {
      setSubmitError(t("error_generic"));
    }
  }

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

  if (submitted) {
    return (
      <RsvpSuccessOverlay
        liteMotion={liteMotion}
        showConfetti={showConfetti}
        submittedName={submittedName}
        submittedAttending={submittedAttending}
        onHideConfetti={() => setShowConfetti(false)}
        onDismiss={() => {
          setSubmitted(false);
          setSubmittedAttending(null);
        }}
      />
    );
  }

  return (
    <div className="relative w-full max-w-2xl shrink-0 py-12">
      <RsvpPhotoCluster />

      <AnimatedReveal
        direction="up"
        duration={1.2}
        blur
        className="group/form relative z-20 overflow-hidden rounded-4xl border border-accent/24 bg-bg-primary/72 shadow-[0_30px_100px_rgba(0,0,0,0.25)] md:rounded-[2.5rem]"
      >
        <div className="pointer-events-none absolute inset-0 z-20 rounded-4xl border border-accent/0 transition-colors duration-500 group-hover/form:border-accent/40 md:rounded-[2.5rem]" />

        <form
          onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
          className="relative z-10 p-6 md:p-12"
        >
          {!liteMotion && (
            <>
              <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
              <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
            </>
          )}

          <input type="hidden" {...register("guests")} />
          <input type="hidden" {...register("slug")} />
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
            {...register("website")}
          />

          <motion.div
            variants={formStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            className="relative z-10 space-y-7 md:space-y-9"
          >
            {guestVocative && maxSeats ? (
              <RsvpPersonalizedNoteSection
                guestVocative={guestVocative}
                maxSeats={maxSeats}
                t={translateSection}
                formField={formField}
              />
            ) : null}

            <RsvpGuestNamesSection
              errors={errors}
              formField={formField}
              isSubmitting={isSubmitting}
              register={register}
              t={translateSection}
              visibleGuestFieldsCount={visibleGuestFieldsCount}
              guestNameKeys={guestNameKeys}
            />

            <motion.div variants={formField}>
              <RsvpDivider />
            </motion.div>

            <RsvpAttendanceSection
              attending={attendingChoice}
              errors={errors}
              formField={formField}
              isSubmitting={isSubmitting}
              onAttendingChange={handleAttendingChange}
              t={translateSection}
            />

            <RsvpAttendingDetailsSection
              guests={guestsValue}
              isAttendingYes={attendingChoice === "yes"}
              isSubmitting={isSubmitting}
              maxGuestCount={maxSeats ?? 10}
              register={register}
              t={translateSection}
              onGuestsChange={handleGuestsChange}
            />

            <motion.div variants={formField}>
              <RsvpDivider />
            </motion.div>

            <RsvpMessageSection
              formField={formField}
              isSubmitting={isSubmitting}
              register={register}
              t={translateSection}
            />

            <RsvpSubmitSection
              attending={attendingChoice}
              formField={formField}
              isSubmitting={isSubmitting}
              liteMotion={liteMotion}
              submitError={submitError}
              t={translateSection}
            />
          </motion.div>
        </form>
      </AnimatedReveal>
    </div>
  );
}
