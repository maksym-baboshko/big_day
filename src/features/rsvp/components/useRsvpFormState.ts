"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { type DefaultValues, type UseFormReturn, useForm } from "react-hook-form";

import { rsvpSchema } from "../schema/rsvp-schema";
import type { RsvpFormData } from "../schema/rsvp-schema";

interface UseRsvpFormStateParams {
  initialGuestName?: string;
  maxSeats?: number;
  slug?: string;
}

interface UseRsvpFormStateResult {
  attendingChoice: RsvpFormData["attending"] | undefined;
  defaultValues: DefaultValues<RsvpFormData>;
  form: UseFormReturn<RsvpFormData>;
  guestNameKeys: string[];
  guestsValue: number;
  hasAttemptedSubmit: boolean;
  handleGuestsChange: (newCount: number) => void;
  visibleGuestFieldsCount: number;
}

export function useRsvpFormState({
  initialGuestName,
  maxSeats,
  slug,
}: UseRsvpFormStateParams): UseRsvpFormStateResult {
  const guestNameKeyCounterRef = useRef(1);
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
  const form = useForm<RsvpFormData>({
    resolver: zodResolver(rsvpSchema),
    defaultValues,
  });
  const attendingChoice = form.watch("attending");
  const guestsValue = form.watch("guests") ?? 1;
  const guestNames = form.watch("guestNames") ?? [""];
  const visibleGuestFieldsCount = attendingChoice === "yes" ? guestsValue : 1;
  const hasAttemptedSubmit = form.formState.submitCount > 0;

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
      form.setValue("guestNames", updated, { shouldValidate: hasAttemptedSubmit });
    }
  }, [form, guestNames, hasAttemptedSubmit, visibleGuestFieldsCount]);

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

  function handleGuestsChange(newCount: number): void {
    if (maxSeats && newCount > maxSeats) {
      return;
    }

    const clamped = Math.max(1, Math.min(maxSeats ?? 20, newCount));
    const current = guestNames.length;
    const updated =
      clamped > current
        ? [...guestNames, ...Array<string>(clamped - current).fill("")]
        : guestNames.slice(0, clamped);

    form.setValue("guests", clamped, { shouldValidate: hasAttemptedSubmit });
    form.setValue("guestNames", updated, { shouldValidate: hasAttemptedSubmit });
  }

  return {
    attendingChoice,
    defaultValues,
    form,
    guestNameKeys,
    guestsValue,
    hasAttemptedSubmit,
    handleGuestsChange,
    visibleGuestFieldsCount,
  };
}
