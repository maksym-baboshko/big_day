export const LAST_VISITED_ROUTE_STORAGE_KEY = "diandmax:last-visited-route";

export function buildRememberVisitedRouteScript(): string {
  return `
    try {
      var pathname = window.location.pathname || "/";
      var route = pathname + window.location.search;
      sessionStorage.setItem(${JSON.stringify(LAST_VISITED_ROUTE_STORAGE_KEY)}, route);
    } catch (_error) {}
  `;
}
