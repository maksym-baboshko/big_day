"use client";

import { type RefObject, useEffect, useRef } from "react";
import type { FieldErrors, UseFormSetFocus } from "react-hook-form";

import type { RsvpFormData } from "../schema/rsvp-schema";

interface UseRsvpFocusManagementParams {
  attendingChoice: RsvpFormData["attending"] | undefined;
  setFocus: UseFormSetFocus<RsvpFormData>;
  visibleGuestFieldsCount: number;
}

interface UseRsvpFocusManagementResult {
  attendingYesButtonRef: RefObject<HTMLButtonElement | null>;
  handleInvalidSubmit: (formErrors: FieldErrors<RsvpFormData>) => void;
  queueGuestFieldFocus: (guestFieldIndex: number | null) => void;
}

export function useRsvpFocusManagement({
  attendingChoice,
  setFocus,
  visibleGuestFieldsCount,
}: UseRsvpFocusManagementParams): UseRsvpFocusManagementResult {
  const attendingYesButtonRef = useRef<HTMLButtonElement | null>(null);
  const guestFieldToFocusRef = useRef<number | null>(null);

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

  function queueGuestFieldFocus(guestFieldIndex: number | null): void {
    guestFieldToFocusRef.current = guestFieldIndex;
  }

  function handleInvalidSubmit(formErrors: FieldErrors<RsvpFormData>): void {
    if (Array.isArray(formErrors.guestNames)) {
      const firstInvalidGuestIndex = formErrors.guestNames.findIndex(Boolean);

      if (firstInvalidGuestIndex >= 0) {
        setFocus(`guestNames.${firstInvalidGuestIndex}`);
        return;
      }
    }

    if (formErrors.attending) {
      attendingYesButtonRef.current?.focus();
      return;
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

  return {
    attendingYesButtonRef,
    handleInvalidSubmit,
    queueGuestFieldFocus,
  };
}
