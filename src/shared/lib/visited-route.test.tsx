// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { LAST_VISITED_ROUTE_STORAGE_KEY, buildRememberVisitedRouteScript } from "./visited-route";

describe("buildRememberVisitedRouteScript", () => {
  it("stores the current pathname and search from window.location", () => {
    window.history.replaceState({}, "", "/en/live?state=empty");

    const script = buildRememberVisitedRouteScript();

    new Function(script)();

    expect(window.sessionStorage.getItem(LAST_VISITED_ROUTE_STORAGE_KEY)).toBe(
      "/en/live?state=empty",
    );
  });

  it("does not embed user-controlled route text into the inline script source", () => {
    const maliciousRoute = "/live?state=</script><script>alert(1)</script>";
    window.history.replaceState({}, "", maliciousRoute);

    const script = buildRememberVisitedRouteScript();
    const normalizedRoute = window.location.pathname + window.location.search;

    expect(script).not.toContain(maliciousRoute);

    new Function(script)();

    expect(window.sessionStorage.getItem(LAST_VISITED_ROUTE_STORAGE_KEY)).toBe(normalizedRoute);
    expect(normalizedRoute).not.toContain("</script>");
  });
});
