"use client";

import { MOTION_EASE, cn } from "@/shared/lib";
import { Button, Input, Textarea } from "@/shared/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { submitRsvp } from "../actions/submit-rsvp";
import { rsvpSchema } from "../schema/rsvp-schema";
import type { RsvpFormData } from "../schema/rsvp-schema";

interface RsvpFormProps {
  slug?: string;
  guestVocative?: string;
  maxSeats?: number;
}

export function RsvpForm({ slug, guestVocative, maxSeats }: RsvpFormProps) {
  const t = useTranslations("RSVP");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attendingChoice, setAttendingChoice] = useState<"yes" | "no" | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      attending: undefined,
      guests: 1,
      guestNames: [""],
      slug,
    },
  });

  const guestsValue = watch("guests") ?? 1;
  const guestNames = watch("guestNames") ?? [""];

  function handleAttendingChange(value: "yes" | "no") {
    setAttendingChoice(value);
    setValue("attending", value, { shouldValidate: true });
  }

  function handleGuestsChange(newCount: number) {
    if (maxSeats && newCount > maxSeats) return;
    const clamped = Math.max(1, Math.min(maxSeats ?? 20, newCount));
    const current = guestNames.length;
    const updated =
      clamped > current
        ? [...guestNames, ...Array<string>(clamped - current).fill("")]
        : guestNames.slice(0, clamped);
    setValue("guests", clamped, { shouldValidate: true });
    setValue("guestNames", updated, { shouldValidate: true });
  }

  async function onSubmit(data: RsvpFormData) {
    setSubmitError(null);
    const result = await submitRsvp(data);
    if (result.success) {
      setSubmitted(true);
    } else {
      setSubmitError(t("error_generic"));
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: MOTION_EASE }}
        className="flex flex-col items-center gap-4 py-12 text-center"
      >
        <div className="font-cinzel text-5xl text-accent">✦</div>
        <h3 className="heading-serif text-2xl">
          {guestVocative ? t("success_title_named", { name: guestVocative }) : t("success_title")}
        </h3>
        <p className="text-text-secondary">
          {attendingChoice === "no" ? t("success_subtitle_no") : t("success_subtitle_yes")}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        {...register("website")}
      />

      {/* Attending toggle */}
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-text-secondary">
          {t("attending_label")}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleAttendingChange(val)}
              className={cn(
                "rounded-2xl border-2 px-4 py-5 text-left transition-all duration-200",
                attendingChoice === val
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-accent/20 text-text-secondary hover:border-accent/50",
              )}
            >
              <div className="font-cinzel text-lg font-bold">
                {t(val === "yes" ? "attending_yes_heading" : "attending_no_heading")}
              </div>
              <div className="mt-0.5 text-xs">
                {t(val === "yes" ? "attending_yes_note" : "attending_no_note")}
              </div>
            </button>
          ))}
        </div>
        {errors.attending && <p className="mt-2 text-sm text-error">{t("attendance_required")}</p>}
      </fieldset>

      <AnimatePresence>
        {attendingChoice === "yes" && (
          <motion.div
            key="yes-fields"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: MOTION_EASE }}
            className="flex flex-col gap-6 overflow-hidden"
          >
            {/* Guest count */}
            <div>
              <p className="mb-3 text-sm font-medium text-text-secondary">{t("guests_label")}</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleGuestsChange(guestsValue - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 text-accent transition-colors hover:bg-accent/10"
                  aria-label="Decrease guests"
                >
                  −
                </button>
                <span className="font-cinzel w-6 text-center text-xl font-bold text-text-primary">
                  {guestsValue}
                </span>
                <button
                  type="button"
                  onClick={() => handleGuestsChange(guestsValue + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 text-accent transition-colors hover:bg-accent/10"
                  aria-label="Increase guests"
                >
                  +
                </button>
              </div>
            </div>

            {/* Guest names */}
            <div>
              <p className="mb-1 text-sm font-medium text-text-secondary">
                {t("guest_names_label")}
              </p>
              <p className="mb-3 text-xs text-text-secondary">{t("guest_names_hint")}</p>
              <div className="flex flex-col gap-3">
                {guestNames.map((_, index) => (
                  <Input
                    key={index}
                    placeholder={t("guest_name_placeholder")}
                    aria-label={t("guest_name_field_label", { number: index + 1 })}
                    error={!!errors.guestNames?.[index]}
                    {...register(`guestNames.${index}`)}
                  />
                ))}
              </div>
              {errors.guestNames && (
                <p className="mt-2 text-sm text-error">{t("guest_names_required")}</p>
              )}
            </div>

            {/* Dietary */}
            <div>
              <label
                htmlFor="dietary"
                className="mb-1 block text-sm font-medium text-text-secondary"
              >
                {t("dietary_label")}
              </label>
              <Textarea
                id="dietary"
                placeholder={t("dietary_placeholder")}
                {...register("dietary")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message */}
      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium text-text-secondary">
          {t("message_label")}
        </label>
        <Textarea id="message" placeholder={t("message_placeholder")} {...register("message")} />
      </div>

      {submitError && <p className="text-sm text-error">{submitError}</p>}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? t("submit_loading") : t("submit")}
        </Button>
        <p className="text-center text-xs text-text-secondary">
          {isSubmitting ? t("submit_loading_note") : t("delivery_note")}
        </p>
      </div>
    </form>
  );
}
