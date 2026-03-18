import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { buildContentSecurityPolicy } from "./shared/lib/server";
import type { Locale } from "./shared/i18n/routing";
import { routing } from "./shared/i18n/routing";

const intlMiddleware = createMiddleware(routing);

function getRequestLocale(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/")
    ? "en"
    : routing.defaultLocale;
}

export default async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  if (!request.cookies.has("NEXT_LOCALE")) {
    requestHeaders.set("accept-language", "uk");
  }

  const requestWithHeaders = new NextRequest(request.url, {
    headers: requestHeaders,
  });

  const response = intlMiddleware(requestWithHeaders);
  const locale = getRequestLocale(request.nextUrl.pathname);
  const contentSecurityPolicy = await buildContentSecurityPolicy(locale);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
