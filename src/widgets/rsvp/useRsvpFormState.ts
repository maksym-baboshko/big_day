"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Guest } from "@/shared/config";
import { useLiteMotion } from "@/shared/lib";
import { rsvpSchema, type RSVPFormData } from "./model";
import {
  createDefaultFormValues,
  getSubmittedDisplayName,
  getVisibleGuestFieldsCount,
  shouldResetPersonalizedDefaults,
  syncGuestNames,
  type RSVPDefaultValues,
} from "./rsvp-form-helpers";

interface PersonalizedDefaultsSnapshot {
  key: string;
  values: RSVPDefaultValues;
}

export function useRsvpFormState(guest?: Guest) {
  const t = useTranslations("RSVP");
  const locale = useLocale() as "uk" | "en";
  const liteMotion = useLiteMotion();
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedAttending, setSubmittedAttending] =
    useState<RSVPFormData["attending"] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const maxGuestCount = guest?.seats ?? 10;
  const defaultFormValues = useMemo(
    () => createDefaultFormValues(guest, locale),
    [guest, locale]
  );
  const personalizedDefaultsKey = guest ? `${guest.slug}:${locale}` : null;
  const previousPersonalizedDefaultsRef =
    useRef<PersonalizedDefaultsSnapshot | null>(null);

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
  const visibleGuestFieldsCount = getVisibleGuestFieldsCount(attending, guests);

  useEffect(() => {
    const nextGuestNames = syncGuestNames(
      watchedGuestNames,
      visibleGuestFieldsCount
    );
    const currentGuestNames = watchedGuestNames?.length ? watchedGuestNames : [""];

    if (
      nextGuestNames.length === currentGuestNames.length &&
      nextGuestNames.every((name, index) => name === currentGuestNames[index])
    ) {
      return;
    }

    setValue("guestNames", nextGuestNames, { shouldDirty: true });
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
    const currentGuestCount = getValues("guests") ?? 1;

    if (
      shouldResetPersonalizedDefaults({
        currentGuestNames: currentNames,
        currentGuestCount,
        previousDefaults: previousPersonalizedDefaults.values,
        attending: getValues("attending"),
        dietary: getValues("dietary"),
        message: getValues("message"),
      })
    ) {
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

      setSubmittedName(getSubmittedDisplayName(data.guestNames));
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

  return {
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
    hideConfetti: () => setShowConfetti(false),
    dismissSubmitted: () => {
      setSubmitted(false);
      setSubmittedAttending(null);
    },
  };
}
