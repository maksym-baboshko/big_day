// @vitest-environment jsdom

import { renderWithAppProviders } from "@/testing/react/render";
import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InViewReveal } from "./InViewReveal";
import { PageEnterReveal } from "./PageEnterReveal";

const mockRevealState = vi.hoisted(() => ({
  intersectionRatio: 0,
  motion: {
    backdropBlur: undefined as string | undefined,
    delay: 0.1,
    duration: 0.6,
    x: 12,
    y: 20,
  },
  navigationType: "navigate" as NavigationTimingType | null,
}));

vi.mock("./reveal-shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./reveal-shared")>();

  return {
    ...actual,
    getIntersectionRatio: () => mockRevealState.intersectionRatio,
    getNavigationType: () => mockRevealState.navigationType,
    resolveRevealMotion: () => mockRevealState.motion,
  };
});

class ControlledIntersectionObserver implements IntersectionObserver {
  static instances: ControlledIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: readonly number[];
  private target: Element | null = null;
  readonly disconnect = vi.fn();
  readonly observe = vi.fn((target: Element) => {
    this.target = target;
  });
  readonly unobserve = vi.fn();

  constructor(
    private readonly callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : options?.threshold !== undefined
        ? [options.threshold]
        : [];
    ControlledIntersectionObserver.instances.push(this);
  }

  emit({
    intersectionRatio,
    isIntersecting,
  }: {
    intersectionRatio: number;
    isIntersecting: boolean;
  }) {
    if (!this.target) {
      throw new Error("Expected observer target to be set before emitting.");
    }

    this.callback(
      [
        {
          boundingClientRect: this.target.getBoundingClientRect(),
          intersectionRatio,
          intersectionRect: this.target.getBoundingClientRect(),
          isIntersecting,
          rootBounds: null,
          target: this.target,
          time: Date.now(),
        },
      ],
      this,
    );
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function getObserver(): ControlledIntersectionObserver {
  const observer = ControlledIntersectionObserver.instances[0];

  if (!observer) {
    throw new Error("Expected an IntersectionObserver instance to exist.");
  }

  return observer;
}

describe("reveal components", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    ControlledIntersectionObserver.instances = [];
    globalThis.IntersectionObserver = ControlledIntersectionObserver;
    mockRevealState.intersectionRatio = 0;
    mockRevealState.motion = {
      backdropBlur: undefined,
      delay: 0.1,
      duration: 0.6,
      x: 12,
      y: 20,
    };
    mockRevealState.navigationType = "navigate";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reveals in-view content on observer updates and can hide again when once is false", () => {
    renderWithAppProviders(
      <InViewReveal once={false}>
        <div data-testid="in-view-child">Hello</div>
      </InViewReveal>,
    );

    const wrapper = screen.getByTestId("in-view-child").parentElement;
    const observer = getObserver();

    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.opacity).toBe("0.001");
    expect(wrapper?.style.transform).toBe("translate3d(12px, 20px, 0)");

    act(() => {
      vi.advanceTimersByTime(16);
      observer.emit({ intersectionRatio: 0.6, isIntersecting: true });
    });

    expect(wrapper?.style.opacity).toBe("1");
    expect(wrapper?.style.transform).toBe("none");
    expect(wrapper?.style.transitionDelay).toBe("0.1s");

    act(() => {
      observer.emit({ intersectionRatio: 0, isIntersecting: false });
    });

    expect(wrapper?.style.opacity).toBe("0.001");
    expect(wrapper?.style.transform).toBe("translate3d(12px, 20px, 0)");
  });

  it("treats threshold zero as a pure intersection toggle and unobserves after the first reveal", () => {
    renderWithAppProviders(
      <InViewReveal threshold={0}>
        <div data-testid="threshold-zero-child">Hello</div>
      </InViewReveal>,
    );

    const observer = getObserver();

    act(() => {
      vi.advanceTimersByTime(16);
      observer.emit({ intersectionRatio: 0, isIntersecting: true });
    });

    expect(observer.unobserve).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("threshold-zero-child").parentElement?.style.opacity).toBe("1");
  });

  it("keeps history-restore elements revealed and still listens for later viewport exits", () => {
    mockRevealState.navigationType = "back_forward";
    mockRevealState.intersectionRatio = 0.7;

    renderWithAppProviders(
      <InViewReveal once={false}>
        <div data-testid="history-child">Hello</div>
      </InViewReveal>,
    );

    const wrapper = screen.getByTestId("history-child").parentElement;
    const observer = getObserver();

    expect(wrapper?.style.opacity).toBe("1");

    act(() => {
      vi.advanceTimersByTime(16);
      observer.emit({ intersectionRatio: 0, isIntersecting: false });
    });

    expect(wrapper?.style.opacity).toBe("0.001");
  });

  it("animates page-enter content on normal navigation and applies optional backdrop blur", () => {
    mockRevealState.motion = {
      backdropBlur: "blur(12px)",
      delay: 0.05,
      duration: 0.25,
      x: 5,
      y: 6,
    };

    renderWithAppProviders(
      <PageEnterReveal blur>
        <div data-testid="page-enter-child">Hello</div>
      </PageEnterReveal>,
    );

    const wrapper = screen.getByTestId("page-enter-child").parentElement;

    expect(wrapper?.style.opacity).toBe("0.001");
    expect(wrapper?.style.transform).toBe("translate3d(5px, 6px, 0)");
    expect(wrapper?.style.backdropFilter).toBe("blur(12px)");

    act(() => {
      vi.advanceTimersByTime(32);
    });

    expect(wrapper?.style.opacity).toBe("1");
    expect(wrapper?.style.transform).toBe("none");
    expect(wrapper?.style.transitionDuration).toBe("0.25s");
    expect(wrapper?.style.transitionDelay).toBe("0.05s");
  });

  it("stays visible on history restore without replaying the hidden state", () => {
    mockRevealState.navigationType = "back_forward";

    renderWithAppProviders(
      <PageEnterReveal>
        <div data-testid="history-page-enter-child">Hello</div>
      </PageEnterReveal>,
    );

    const wrapper = screen.getByTestId("history-page-enter-child").parentElement;

    expect(wrapper?.style.opacity).toBe("1");

    act(() => {
      vi.advanceTimersByTime(16);
    });

    expect(wrapper?.style.opacity).toBe("1");
    expect(wrapper?.style.transform).toBe("none");
  });
});
