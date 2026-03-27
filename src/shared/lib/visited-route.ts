export const LAST_VISITED_ROUTE_STORAGE_KEY = "diandmax:last-visited-route";

export function buildRememberVisitedRouteScript(route: string): string {
  return `
    try {
      sessionStorage.setItem(${JSON.stringify(LAST_VISITED_ROUTE_STORAGE_KEY)}, ${JSON.stringify(route)});
    } catch (_error) {}
  `;
}
