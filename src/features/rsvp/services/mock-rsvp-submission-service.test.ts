import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RsvpSubmissionInput } from "../types";
import { mockRsvpSubmissionService } from "./mock-rsvp-submission-service";

const RSVP_STORAGE_KEY = "diandmax:rsvp-submissions";

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.get(key) ?? null;
    },
    key(index) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

const validSubmission: RsvpSubmissionInput = {
  attending: "yes",
  dietary: "",
  guestNames: ["  Ігор Бабошко  ", "Марія Бабошко"],
  guests: 2,
  message: "  До зустрічі!  ",
  slug: "papa-ihor",
  website: "",
};

describe("mockRsvpSubmissionService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const localStorage = createStorageMock();

    vi.stubGlobal("crypto", { randomUUID: () => "request-123" });
    vi.stubGlobal("window", {
      localStorage,
      setTimeout: globalThis.setTimeout,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("persists valid RSVP submissions into localStorage", async () => {
    const submitPromise = mockRsvpSubmissionService.submit(validSubmission);

    await vi.advanceTimersByTimeAsync(850);

    await expect(submitPromise).resolves.toEqual({
      success: true,
      requestId: "request-123",
      mode: "mock",
    });

    expect(JSON.parse(window.localStorage.getItem(RSVP_STORAGE_KEY) ?? "[]")).toEqual([
      {
        ...validSubmission,
        guestNames: ["Ігор Бабошко", "Марія Бабошко"],
        message: "До зустрічі!",
      },
    ]);
  });

  it("rejects invalid RSVP payloads before touching storage", async () => {
    await expect(
      mockRsvpSubmissionService.submit({
        ...validSubmission,
        guestNames: [""],
      }),
    ).resolves.toEqual({
      success: false,
      error: "invalid_input",
      requestId: "request-123",
      mode: "mock",
    });

    expect(window.localStorage.getItem(RSVP_STORAGE_KEY)).toBeNull();
  });

  it("swallows honeypot submissions without persisting them", async () => {
    const submitPromise = mockRsvpSubmissionService.submit({
      ...validSubmission,
      website: "https://spam.example",
    });

    await expect(submitPromise).resolves.toEqual({
      success: true,
      requestId: "request-123",
      mode: "mock",
    });

    expect(window.localStorage.getItem(RSVP_STORAGE_KEY)).toBeNull();
  });

  it("treats invalid JSON in storage as an empty submission list", async () => {
    window.localStorage.setItem(RSVP_STORAGE_KEY, "{not-valid-json");

    const submitPromise = mockRsvpSubmissionService.submit(validSubmission);

    await vi.advanceTimersByTimeAsync(850);

    await expect(submitPromise).resolves.toEqual({
      success: true,
      requestId: "request-123",
      mode: "mock",
    });

    expect(JSON.parse(window.localStorage.getItem(RSVP_STORAGE_KEY) ?? "[]")).toEqual([
      {
        ...validSubmission,
        guestNames: ["Ігор Бабошко", "Марія Бабошко"],
        message: "До зустрічі!",
      },
    ]);
  });

  it("treats non-array storage payloads as an empty submission list", async () => {
    window.localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify({ invalid: true }));

    const submitPromise = mockRsvpSubmissionService.submit(validSubmission);

    await vi.advanceTimersByTimeAsync(850);

    await expect(submitPromise).resolves.toEqual({
      success: true,
      requestId: "request-123",
      mode: "mock",
    });

    expect(JSON.parse(window.localStorage.getItem(RSVP_STORAGE_KEY) ?? "[]")).toEqual([
      {
        ...validSubmission,
        guestNames: ["Ігор Бабошко", "Марія Бабошко"],
        message: "До зустрічі!",
      },
    ]);
  });

  it("treats arrays with invalid submission shapes as an empty submission list", async () => {
    window.localStorage.setItem(
      RSVP_STORAGE_KEY,
      JSON.stringify([{ attending: "yes", guestNames: [""], guests: 0 }]),
    );

    const submitPromise = mockRsvpSubmissionService.submit(validSubmission);

    await vi.advanceTimersByTimeAsync(850);

    await expect(submitPromise).resolves.toEqual({
      success: true,
      requestId: "request-123",
      mode: "mock",
    });

    expect(JSON.parse(window.localStorage.getItem(RSVP_STORAGE_KEY) ?? "[]")).toEqual([
      {
        ...validSubmission,
        guestNames: ["Ігор Бабошко", "Марія Бабошко"],
        message: "До зустрічі!",
      },
    ]);
  });
});
