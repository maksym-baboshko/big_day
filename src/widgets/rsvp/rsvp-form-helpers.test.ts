import {
  createDefaultFormValues,
  getSubmittedDisplayName,
  getVisibleGuestFieldsCount,
  shouldResetPersonalizedDefaults,
  syncGuestNames,
} from "./rsvp-form-helpers";

describe("rsvp-form-helpers", () => {
  it("creates personalized default values from the guest config", () => {
    const defaults = createDefaultFormValues(
      {
        slug: "maksym-and-diana",
        seats: 2,
        name: { uk: "Максим", en: "Maksym" },
        formName: { uk: "Максиме", en: "Maksym" },
        vocative: { uk: "Максиме", en: "Maksym" },
      },
      "uk"
    );

    expect(defaults).toEqual({
      guestNames: ["Максиме"],
      guests: 2,
      dietary: "",
      message: "",
      website: "",
    });
  });

  it("synchronizes guest name slots with the visible guest count", () => {
    expect(getVisibleGuestFieldsCount("yes", 3)).toBe(3);
    expect(getVisibleGuestFieldsCount("no", 3)).toBe(1);
    expect(syncGuestNames(["A"], 3)).toEqual(["A", "", ""]);
    expect(syncGuestNames(["A", "B", "C"], 1)).toEqual(["A"]);
  });

  it("resets personalized defaults only when the form still matches the old guest", () => {
    expect(
      shouldResetPersonalizedDefaults({
        currentGuestNames: ["Old Guest"],
        currentGuestCount: 2,
        previousDefaults: {
          guestNames: ["Old Guest"],
          guests: 2,
          dietary: "",
          message: "",
          website: "",
        },
        attending: undefined,
        dietary: "",
        message: "",
      })
    ).toBe(true);

    expect(
      shouldResetPersonalizedDefaults({
        currentGuestNames: ["Edited Guest"],
        currentGuestCount: 2,
        previousDefaults: {
          guestNames: ["Old Guest"],
          guests: 2,
          dietary: "",
          message: "",
          website: "",
        },
        attending: "yes",
        dietary: "",
        message: "",
      })
    ).toBe(false);
  });

  it("extracts the first submitted display name", () => {
    expect(getSubmittedDisplayName(["  Maksym   B.  "])).toBe("Maksym");
    expect(getSubmittedDisplayName([""])).toBe("");
  });
});
