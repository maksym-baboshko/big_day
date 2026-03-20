import type { Guest } from "@/shared/config";
import type { RSVPFormData } from "./model";

export interface RSVPDefaultValues {
  guestNames: string[];
  guests: number;
  dietary: string;
  message: string;
  website: string;
}

export function createDefaultFormValues(
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

export function getVisibleGuestFieldsCount(
  attending: RSVPFormData["attending"] | undefined,
  guests: number
): number {
  return attending === "yes" ? guests : 1;
}

export function syncGuestNames(
  guestNames: string[] | undefined,
  visibleGuestFieldsCount: number
): string[] {
  const currentGuestNames = guestNames?.length ? guestNames : [""];

  if (currentGuestNames.length === visibleGuestFieldsCount) {
    return currentGuestNames;
  }

  if (currentGuestNames.length < visibleGuestFieldsCount) {
    return [
      ...currentGuestNames,
      ...Array.from(
        { length: visibleGuestFieldsCount - currentGuestNames.length },
        () => ""
      ),
    ];
  }

  return currentGuestNames.slice(0, visibleGuestFieldsCount);
}

export function shouldResetPersonalizedDefaults({
  currentGuestNames,
  currentGuestCount,
  previousDefaults,
  attending,
  dietary,
  message,
}: {
  currentGuestNames: string[];
  currentGuestCount: number;
  previousDefaults: RSVPDefaultValues;
  attending: RSVPFormData["attending"] | undefined;
  dietary: string | undefined;
  message: string | undefined;
}): boolean {
  return (
    currentGuestNames[0] === previousDefaults.guestNames[0] &&
    currentGuestCount === previousDefaults.guests &&
    !attending &&
    !dietary &&
    !message
  );
}

export function getSubmittedDisplayName(guestNames: string[]): string {
  const trimmedName = guestNames[0]?.trim() ?? "";
  return trimmedName.split(/\s+/)[0] ?? "";
}
