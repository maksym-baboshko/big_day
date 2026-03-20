"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Guest } from "@/shared/config";
import { MOTION_EASE } from "@/shared/lib";
import { AnimatedReveal, SectionHeading, SectionWrapper } from "@/shared/ui";
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
import { useRsvpFormState } from "./useRsvpFormState";

const ease = MOTION_EASE;

interface RSVPProps {
  guest?: Guest;
}

export function RSVP({ guest }: RSVPProps) {
  const t = useTranslations("RSVP");
  const {
    locale,
    liteMotion,
    submitted,
    showConfetti,
    submittedName,
    submittedAttending,
    submitError,
    maxGuestCount,
    attending,
    guests,
    isAttendingYes,
    visibleGuestFieldsCount,
    register,
    handleSubmit,
    setValue,
    errors,
    isSubmitting,
    onSubmit,
    hideConfetti,
    dismissSubmitted,
  } = useRsvpFormState(guest);
  const translateSection = (
    key: string,
    values?: Record<string, string | number | null | undefined>
  ) => t(key, values as Record<string, string | number | Date> | undefined);

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
      <RsvpSuccessOverlay
        liteMotion={liteMotion}
        showConfetti={showConfetti}
        submittedName={submittedName}
        submittedAttending={submittedAttending}
        onHideConfetti={hideConfetti}
        onDismiss={dismissSubmitted}
      />
    );
  }

  return (
    <SectionWrapper
      id="rsvp"
      className="relative overflow-hidden pt-12 pb-8 md:py-24"
    >
      <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>

      <div className="relative z-10 mx-auto mt-12 flex max-w-7xl flex-col items-center justify-center px-4 md:mt-32 xl:flex-row">
        <div className="relative w-full max-w-2xl shrink-0 py-12">
          <RsvpPhotoCluster />

          <AnimatedReveal
            direction="up"
            duration={1.2}
            blur
            className="group/form relative z-20 overflow-hidden rounded-4xl border border-accent/24 bg-bg-primary/72 shadow-[0_30px_100px_rgba(0,0,0,0.25)] md:rounded-[2.5rem]"
          >
            <div className="pointer-events-none absolute inset-0 z-20 rounded-4xl border border-accent/0 transition-colors duration-500 group-hover/form:border-accent/40 md:rounded-[2.5rem]" />

            <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-12">
              {!liteMotion && (
                <>
                  <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
                  <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
                </>
              )}

              <input type="hidden" {...register("guests")} />
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
                {guest ? (
                  <RsvpPersonalizedNoteSection
                    guest={guest}
                    locale={locale}
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
                />

                <motion.div variants={formField}>
                  <RsvpDivider />
                </motion.div>

                <RsvpAttendanceSection
                  attending={attending}
                  errors={errors}
                  formField={formField}
                  isSubmitting={isSubmitting}
                  setValue={setValue}
                  t={translateSection}
                />

                <RsvpAttendingDetailsSection
                  guests={guests}
                  isAttendingYes={isAttendingYes}
                  isSubmitting={isSubmitting}
                  maxGuestCount={maxGuestCount}
                  register={register}
                  setValue={setValue}
                  t={translateSection}
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
                  attending={attending}
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
      </div>
    </SectionWrapper>
  );
}
