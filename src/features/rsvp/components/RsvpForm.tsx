"use client";

import { MOTION_EASE, useLiteMotion } from "@/shared/lib";
import { AnimatedReveal } from "@/shared/ui";
import { type Variants, motion } from "motion/react";
import { useTranslations } from "next-intl";
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
import { RsvpPanel } from "./RsvpPanel";
import { RsvpSuccessOverlay } from "./RsvpSuccessOverlay";
import { useRsvpFocusManagement } from "./useRsvpFocusManagement";
import { useRsvpFormState } from "./useRsvpFormState";
import { useRsvpFormSubmission } from "./useRsvpFormSubmission";

interface RsvpFormProps {
  slug?: string;
  guestVocative?: string;
  maxSeats?: number;
  initialGuestName?: string;
}

export function RsvpForm({ slug, guestVocative, maxSeats, initialGuestName }: RsvpFormProps) {
  const t = useTranslations("RSVP");
  const liteMotion = useLiteMotion();
  const translateSection = (
    key: string,
    values?: Record<string, string | number | null | undefined>,
  ) => t(key, values as Record<string, string | number | Date> | undefined);
  const {
    attendingChoice,
    defaultValues,
    form,
    guestNameKeys,
    guestsValue,
    hasAttemptedSubmit,
    handleGuestsChange,
    visibleGuestFieldsCount,
  } = useRsvpFormState({
    initialGuestName,
    maxSeats,
    slug,
  });
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const { attendingYesButtonRef, handleInvalidSubmit, queueGuestFieldFocus } =
    useRsvpFocusManagement({
      attendingChoice,
      setFocus: form.setFocus,
      visibleGuestFieldsCount,
    });
  const {
    dismissSuccessOverlay,
    onHideConfetti,
    onSubmit,
    showConfetti,
    submitError,
    submitted,
    submittedAttending,
    submittedName,
  } = useRsvpFormSubmission({
    defaultValues,
    guestVocative,
    maxSeats,
    reset,
    t: translateSection,
  });

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
  const panelMotionInitial = liteMotion ? 28 : 44;
  const panelBlurStrengthInitial = liteMotion ? 0.55 : 0.42;

  function handleAttendingChange(value: RsvpFormData["attending"]): void {
    form.setValue("attending", value, { shouldValidate: hasAttemptedSubmit });

    if (value !== "yes" || !guestVocative) {
      queueGuestFieldFocus(null);
      return;
    }

    queueGuestFieldFocus((maxSeats ?? 1) > 1 ? 1 : 0);
  }

  return (
    <div className="relative w-full max-w-2xl shrink-0 py-12">
      <RsvpPhotoCluster />

      <motion.div
        initial={{
          y: panelMotionInitial,
          "--rsvp-panel-blur-strength": panelBlurStrengthInitial,
        }}
        viewport={{ once: true, amount: 0.12 }}
        className="relative z-20"
        whileInView={{
          y: 0,
          "--rsvp-panel-blur-strength": 1,
        }}
        transition={{
          duration: liteMotion ? 0.42 : 0.7,
          ease: MOTION_EASE,
        }}
      >
        <RsvpPanel className="group/form">
          <AnimatedReveal direction="up" duration={1.2} className="relative z-10">
            <form
              noValidate
              onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
              className="relative z-10"
            >
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
                  yesButtonRef={attendingYesButtonRef}
                />

                <RsvpAttendingDetailsSection
                  errors={errors}
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
                  errors={errors}
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
        </RsvpPanel>
      </motion.div>

      {submitted ? (
        <RsvpSuccessOverlay
          liteMotion={liteMotion}
          showConfetti={showConfetti}
          submittedName={submittedName}
          submittedAttending={submittedAttending}
          onHideConfetti={onHideConfetti}
          onDismiss={dismissSuccessOverlay}
        />
      ) : null}
    </div>
  );
}
