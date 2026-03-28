"use client";

import { useEffect, useState } from "react";
import type { DefaultValues, UseFormReset } from "react-hook-form";

import type { RsvpFormData } from "../schema/rsvp-schema";
import { mockRsvpSubmissionService } from "../services/mock-rsvp-submission-service";

type RsvpTranslation = (
  key: string,
  values?: Record<string, string | number | null | undefined>,
) => string;

interface UseRsvpFormSubmissionParams {
  defaultValues: DefaultValues<RsvpFormData>;
  guestVocative?: string;
  maxSeats?: number;
  reset: UseFormReset<RsvpFormData>;
  t: RsvpTranslation;
}

interface UseRsvpFormSubmissionResult {
  dismissSuccessOverlay: () => void;
  onHideConfetti: () => void;
  onSubmit: (data: RsvpFormData) => Promise<void>;
  showConfetti: boolean;
  submitError: string | null;
  submitted: boolean;
  submittedAttending: RsvpFormData["attending"] | null;
  submittedName: string;
}

function getSubmittedDisplayName(guestNames: string[], guestVocative: string | undefined): string {
  const submittedFullName = guestNames.find((name) => name.trim().length > 0)?.trim();

  if (!submittedFullName) {
    return guestVocative ?? "";
  }

  return submittedFullName.split(/\s+/)[0] ?? guestVocative ?? "";
}

export function useRsvpFormSubmission({
  defaultValues,
  guestVocative,
  maxSeats,
  reset,
  t,
}: UseRsvpFormSubmissionParams): UseRsvpFormSubmissionResult {
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedAttending, setSubmittedAttending] = useState<RsvpFormData["attending"] | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  async function onSubmit(data: RsvpFormData): Promise<void> {
    setSubmitError(null);

    if (maxSeats && data.attending === "yes" && (data.guests ?? 1) > maxSeats) {
      setSubmitError(t("personalized_limit_error", { seats: maxSeats }));
      return;
    }

    const result = await mockRsvpSubmissionService.submit(data);

    if (result.success) {
      setSubmittedName(getSubmittedDisplayName(data.guestNames, guestVocative));
      setSubmittedAttending(data.attending);
      setShowConfetti(true);
      setSubmitted(true);
      return;
    }

    setSubmitError(t("error_generic"));
  }

  function onHideConfetti(): void {
    setShowConfetti(false);
  }

  function dismissSuccessOverlay(): void {
    setSubmitted(false);
    setShowConfetti(false);
    setSubmittedAttending(null);
    setSubmittedName("");
    setSubmitError(null);
    reset(defaultValues);
  }

  return {
    dismissSuccessOverlay,
    onHideConfetti,
    onSubmit,
    showConfetti,
    submitError,
    submitted,
    submittedAttending,
    submittedName,
  };
}
