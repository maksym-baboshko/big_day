import { rsvpSchema } from "./schema";

describe("rsvpSchema", () => {
  it("accepts a valid attending payload", () => {
    const result = rsvpSchema.safeParse({
      guestNames: ["Maksym", "Diana"],
      attending: "yes",
      guests: 2,
      dietary: "Vegetarian",
      message: "See you soon",
      website: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects guest count mismatches for attending guests", () => {
    const result = rsvpSchema.safeParse({
      guestNames: ["Maksym"],
      attending: "yes",
      guests: 2,
      dietary: "",
      message: "",
      website: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["guestNames"]);
  });

  it("rejects multiple names when declining", () => {
    const result = rsvpSchema.safeParse({
      guestNames: ["Maksym", "Diana"],
      attending: "no",
      guests: 2,
      dietary: "",
      message: "",
      website: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["guestNames"]);
  });
});
