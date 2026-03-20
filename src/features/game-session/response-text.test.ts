import {
  hasMeaningfulGameResponseText,
  normalizeGameResponseText,
} from "./response-text";

describe("response-text", () => {
  it("normalizes whitespace and trims empty values to null", () => {
    expect(normalizeGameResponseText("  hello   world  ")).toBe("hello world");
    expect(normalizeGameResponseText("   ")).toBeNull();
    expect(normalizeGameResponseText(null)).toBeNull();
  });

  it("accepts meaningful responses and rejects noise", () => {
    expect(hasMeaningfulGameResponseText("Tak")).toBe(true);
    expect(hasMeaningfulGameResponseText("  a ")).toBe(false);
    expect(hasMeaningfulGameResponseText("  123 ")).toBe(false);
    expect(hasMeaningfulGameResponseText("")).toBe(false);
  });
});
