"use client";

import { AnimatePresence, type Variants, motion } from "motion/react";
import Image from "next/image";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { MOTION_EASE, cn } from "@/shared/lib";
import { Input, Textarea } from "@/shared/ui";

import type { RsvpFormData } from "../schema/rsvp-schema";

type RsvpTranslations = (
  key: string,
  values?: Record<string, string | number | null | undefined>,
) => string;

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-text-secondary/90">
      {children}
      {required ? <span className="ml-1 text-accent">*</span> : null}
    </p>
  );
}

export function RsvpDivider() {
  return <div className="h-px bg-accent/16" />;
}

function RingIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      className={cn(
        "transition-all duration-500",
        active ? "text-accent" : "text-text-secondary/42",
      )}
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="13" r="4.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <path
        d="M8.5 13 Q13 7.5 17.5 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function LeafIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      className={cn(
        "transition-all duration-500",
        active ? "text-text-primary" : "text-text-secondary/42",
      )}
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 13 L17 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function RsvpPhotoCluster() {
  return (
    <div className="hidden lg:block">
      <motion.div
        initial={{ opacity: 0, x: 40, y: 40 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: MOTION_EASE }}
        className="absolute -left-36 -top-4 z-0 w-52 xl:-left-45 xl:w-60"
      >
        <div className="group relative">
          <div className="relative aspect-3/4 rotate-2 overflow-hidden rounded-[2.5rem] border border-accent/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-700 group-hover:scale-[1.05] group-hover:rotate-6">
            <Image
              src="/images/rsvp/1.jpeg"
              alt=""
              fill
              sizes="(min-width: 1280px) 240px, 208px"
              loading="lazy"
              className="object-cover grayscale-[0.3] transition-all duration-1000 group-hover:grayscale-0"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40, y: -40 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: MOTION_EASE }}
        className="absolute -bottom-8 -left-36 z-10 w-52 xl:-left-45 xl:w-60"
      >
        <div className="group relative">
          <div className="relative aspect-3/4 -rotate-2 overflow-hidden rounded-[2.5rem] border border-accent/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-transform duration-700 group-hover:scale-[1.05] group-hover:-rotate-6">
            <Image
              src="/images/rsvp/2.jpeg"
              alt=""
              fill
              sizes="(min-width: 1280px) 240px, 208px"
              loading="lazy"
              className="object-cover grayscale-[0.3] transition-all duration-1000 group-hover:grayscale-0"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40, y: 40 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: MOTION_EASE }}
        className="absolute -right-36 -top-4 z-0 w-52 xl:-right-45 xl:w-60"
      >
        <div className="group relative">
          <div className="relative aspect-3/4 -rotate-2 overflow-hidden rounded-[2.5rem] border border-accent/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-700 group-hover:scale-[1.05] group-hover:-rotate-6">
            <Image
              src="/images/rsvp/3.jpeg"
              alt=""
              fill
              sizes="(min-width: 1280px) 240px, 208px"
              loading="lazy"
              className="object-cover grayscale-[0.3] transition-all duration-1000 group-hover:grayscale-0"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40, y: -40 }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: MOTION_EASE }}
        className="absolute -bottom-8 -right-36 z-10 w-52 xl:-right-45 xl:w-60"
      >
        <div className="group relative">
          <div className="relative aspect-3/4 rotate-2 overflow-hidden rounded-[2.5rem] border border-accent/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-700 group-hover:scale-[1.05] group-hover:rotate-6">
            <Image
              src="/images/rsvp/4.jpeg"
              alt=""
              fill
              sizes="(min-width: 1280px) 240px, 208px"
              loading="lazy"
              className="object-cover object-[center_60%] grayscale-[0.3] transition-all duration-1000 group-hover:grayscale-0"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface RsvpPersonalizedNoteSectionProps {
  guestVocative: string;
  maxSeats: number;
  t: RsvpTranslations;
  formField: Variants;
}

export function RsvpPersonalizedNoteSection({
  guestVocative,
  maxSeats,
  t,
  formField,
}: RsvpPersonalizedNoteSectionProps) {
  return (
    <>
      <motion.div variants={formField}>
        <div className="rounded-[1.75rem] border border-accent/22 bg-accent/12 px-5 py-4 text-left">
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent">
            {t("personalized_note_label")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary/90 md:text-[15px]">
            {t("personalized_note", {
              name: guestVocative,
              seats: maxSeats,
            })}
          </p>
        </div>
      </motion.div>

      <motion.div variants={formField}>
        <RsvpDivider />
      </motion.div>
    </>
  );
}

interface RsvpGuestNamesSectionProps {
  errors: FieldErrors<RsvpFormData>;
  formField: Variants;
  isSubmitting: boolean;
  register: UseFormRegister<RsvpFormData>;
  t: RsvpTranslations;
  visibleGuestFieldsCount: number;
  guestNameKeys: string[];
}

export function RsvpGuestNamesSection({
  errors,
  formField,
  isSubmitting,
  register,
  t,
  visibleGuestFieldsCount,
  guestNameKeys,
}: RsvpGuestNamesSectionProps) {
  return (
    <motion.div variants={formField}>
      <FieldLabel required>
        {visibleGuestFieldsCount > 1 ? t("guest_names_label") : t("name_label")}
      </FieldLabel>
      <div className="space-y-3">
        {guestNameKeys.slice(0, visibleGuestFieldsCount).map((key, index) => {
          const fieldError = errors.guestNames?.[index];
          const isPrimaryField = index === 0;

          return (
            <div key={key}>
              {visibleGuestFieldsCount > 1 ? (
                <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-text-secondary/90">
                  {t("guest_name_field_label", { number: index + 1 })}
                </p>
              ) : null}
              <Input
                placeholder={isPrimaryField ? t("name_placeholder") : t("guest_name_placeholder")}
                error={!!fieldError}
                disabled={isSubmitting}
                className="rounded-2xl py-4 text-base"
                {...register(`guestNames.${index}`)}
              />
              {fieldError ? (
                <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-error/85">
                  {t("name_min")}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      {visibleGuestFieldsCount > 1 ? (
        <p className="mt-3 text-[10px] uppercase tracking-[0.13em] text-text-secondary/90">
          {t("guest_names_hint")}
        </p>
      ) : null}
      {errors.guestNames && !Array.isArray(errors.guestNames) ? (
        <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-error/85">
          {t("guest_names_required")}
        </p>
      ) : null}
    </motion.div>
  );
}

interface RsvpAttendanceSectionProps {
  attending: RsvpFormData["attending"] | undefined;
  errors: FieldErrors<RsvpFormData>;
  formField: Variants;
  isSubmitting: boolean;
  onAttendingChange: (value: RsvpFormData["attending"]) => void;
  t: RsvpTranslations;
}

export function RsvpAttendanceSection({
  attending,
  errors,
  formField,
  isSubmitting,
  onAttendingChange,
  t,
}: RsvpAttendanceSectionProps) {
  return (
    <motion.div variants={formField}>
      <FieldLabel>{t("attending_label")}</FieldLabel>
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
          onClick={() => onAttendingChange("yes")}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 px-3 py-5 transition-all duration-500 md:py-8",
            focusRingClass,
            attending === "yes"
              ? "border-accent bg-accent/12 shadow-[0_14px_38px_-30px_rgba(var(--accent-rgb),0.75)]"
              : "border-accent/18 bg-bg-primary/72 hover:border-accent/40",
          )}
          aria-pressed={attending === "yes"}
        >
          <AnimatePresence>
            {attending === "yes" ? (
              <motion.div
                key="yes-glow"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 bg-linear-to-b from-accent/12 to-transparent"
              />
            ) : null}
          </AnimatePresence>
          <RingIcon active={attending === "yes"} />
          <span
            className={cn(
              "heading-serif text-lg transition-colors duration-300 md:text-xl",
              attending === "yes" ? "text-accent" : "text-text-secondary/88",
            )}
          >
            {t("attending_yes_heading")}
          </span>
          <span className="text-center text-[9px] leading-tight uppercase tracking-[0.14em] text-text-secondary/90 md:text-[10px]">
            {t("attending_yes_note")}
          </span>
        </motion.button>

        <motion.button
          type="button"
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
          onClick={() => onAttendingChange("no")}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 px-3 py-5 transition-all duration-500 md:py-8",
            focusRingClass,
            attending === "no"
              ? "border-text-secondary/48 bg-text-primary/8"
              : "border-accent/18 bg-bg-primary/72 hover:border-accent/32",
          )}
          aria-pressed={attending === "no"}
        >
          <LeafIcon active={attending === "no"} />
          <span
            className={cn(
              "heading-serif text-lg transition-colors duration-300 md:text-xl",
              attending === "no" ? "text-text-primary" : "text-text-secondary/88",
            )}
          >
            {t("attending_no_heading")}
          </span>
          <span className="text-center text-[9px] leading-tight uppercase tracking-[0.14em] text-text-secondary/90 md:text-[10px]">
            {t("attending_no_note")}
          </span>
        </motion.button>
      </div>
      {errors.attending ? (
        <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-error/85">
          {t("attendance_required")}
        </p>
      ) : null}
    </motion.div>
  );
}

interface RsvpAttendingDetailsSectionProps {
  guests: number;
  isAttendingYes: boolean;
  isSubmitting: boolean;
  maxGuestCount: number;
  register: UseFormRegister<RsvpFormData>;
  t: RsvpTranslations;
  onGuestsChange: (newCount: number) => void;
}

export function RsvpAttendingDetailsSection({
  guests,
  isAttendingYes,
  isSubmitting,
  maxGuestCount,
  register,
  t,
  onGuestsChange,
}: RsvpAttendingDetailsSectionProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: isAttendingYes ? "1fr" : "0fr",
        transition: "grid-template-rows 0.5s var(--ease-default)",
      }}
      aria-hidden={!isAttendingYes}
      inert={!isAttendingYes}
    >
      <div
        className={cn("overflow-hidden", !isAttendingYes && "pointer-events-none")}
        style={{
          opacity: isAttendingYes ? 1 : 0,
          transition: `opacity ${isAttendingYes ? "0.4s 0.08s" : "0.25s 0s"} var(--ease-default)`,
        }}
      >
        <div className="space-y-7 md:space-y-9">
          <RsvpDivider />

          <div>
            <FieldLabel>{t("guests_label")}</FieldLabel>
            <div className="flex w-full items-center justify-between rounded-2xl border border-accent/22 bg-bg-primary/55 px-5 py-3">
              <button
                type="button"
                disabled={!isAttendingYes || isSubmitting || guests <= 1}
                onClick={() => onGuestsChange(guests - 1)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border border-accent/32 text-xl leading-none transition-all duration-300",
                  focusRingClass,
                  !isAttendingYes || isSubmitting || guests <= 1
                    ? "cursor-not-allowed border-accent/18 bg-bg-secondary/35 text-accent/38"
                    : "cursor-pointer text-accent/85 hover:border-accent hover:bg-accent/12 hover:text-accent",
                )}
                aria-label="Decrease guests"
              >
                −
              </button>
              <motion.span
                key={guests}
                initial={{ scale: 1.25, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.22, ease: MOTION_EASE }}
                className="select-none font-cinzel text-3xl text-accent"
              >
                {guests}
              </motion.span>
              <button
                type="button"
                disabled={!isAttendingYes || isSubmitting || guests >= maxGuestCount}
                onClick={() => onGuestsChange(guests + 1)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border border-accent/32 text-xl leading-none transition-all duration-300",
                  focusRingClass,
                  !isAttendingYes || isSubmitting || guests >= maxGuestCount
                    ? "cursor-not-allowed border-accent/18 bg-bg-secondary/35 text-accent/38"
                    : "cursor-pointer text-accent/85 hover:border-accent hover:bg-accent/12 hover:text-accent",
                )}
                aria-label="Increase guests"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <FieldLabel>{t("dietary_label")}</FieldLabel>
            <Textarea
              id="dietary"
              placeholder={t("dietary_placeholder")}
              disabled={!isAttendingYes || isSubmitting}
              className="min-h-24 rounded-2xl text-sm"
              {...register("dietary")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface RsvpMessageSectionProps {
  formField: Variants;
  isSubmitting: boolean;
  register: UseFormRegister<RsvpFormData>;
  t: RsvpTranslations;
}

export function RsvpMessageSection({
  formField,
  isSubmitting,
  register,
  t,
}: RsvpMessageSectionProps) {
  return (
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
  );
}

interface RsvpSubmitSectionProps {
  attending: RsvpFormData["attending"] | undefined;
  formField: Variants;
  isSubmitting: boolean;
  liteMotion: boolean;
  submitError: string | null;
  t: RsvpTranslations;
}

export function RsvpSubmitSection({
  attending,
  formField,
  isSubmitting,
  liteMotion,
  submitError,
  t,
}: RsvpSubmitSectionProps) {
  return (
    <motion.div variants={formField} className="pt-1">
      {submitError ? (
        <p className="mb-3 text-center text-[10px] uppercase tracking-[0.13em] text-error/90">
          {submitError}
        </p>
      ) : null}
      <motion.button
        type="submit"
        disabled={!attending || isSubmitting}
        whileHover={attending && !isSubmitting ? { scale: 1.01 } : undefined}
        whileTap={attending && !isSubmitting ? { scale: 0.99 } : undefined}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl py-4 text-base font-medium tracking-wide transition-all duration-500 md:py-5 md:text-lg",
          focusRingClass,
          attending && !isSubmitting
            ? "cursor-pointer bg-accent text-bg-primary shadow-xl shadow-accent/20"
            : "cursor-not-allowed border border-accent/22 bg-accent/22 text-text-primary/58",
        )}
      >
        <span className="relative z-10 flex items-center justify-center gap-3">
          <span>{isSubmitting ? t("submit_loading") : t("submit")}</span>
          {!isSubmitting ? (
            <motion.span
              animate={attending ? { x: [0, 5, 0] } : undefined}
              transition={{
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              →
            </motion.span>
          ) : null}
        </span>
        {attending && !isSubmitting && !liteMotion ? (
          <motion.div
            initial={{ x: "-110%" }}
            whileHover={{ x: "110%" }}
            transition={{ duration: 0.55, ease: MOTION_EASE }}
            className="pointer-events-none absolute inset-0 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/15 to-transparent"
          />
        ) : null}
      </motion.button>

      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.13em] text-text-secondary/90">
        {!attending
          ? t("attendance_required")
          : isSubmitting
            ? t("submit_loading_note")
            : t("delivery_note")}
      </p>
    </motion.div>
  );
}
