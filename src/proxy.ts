import type { Locale } from "@/shared/i18n/routing";
import { isLocale, routing } from "@/shared/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const INTERNAL_NOT_FOUND_SEGMENT = "__not-found";
const VALID_UNPREFIXED_ROOT_SEGMENTS = new Set(["invite", "live"]);

function getCookieLocale(request: NextRequest): Locale | null {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value ?? "";

  return isLocale(cookieLocale) ? cookieLocale : null;
}

function resolveAcceptLanguageLocale(request: NextRequest): Locale {
  const preferredLanguages =
    request.headers
      .get("accept-language")
      ?.split(",")
      .map((part) => part.split(";")[0]?.trim().toLowerCase())
      .filter((language): language is string => Boolean(language)) ?? [];

  const prefersSlavicLocale = preferredLanguages.some(
    (language) =>
      language === "uk" ||
      language.startsWith("uk-") ||
      language === "ru" ||
      language.startsWith("ru-"),
  );

  return prefersSlavicLocale ? "uk" : "en";
}

function resolveRequestLocale(request: NextRequest): Locale {
  return getCookieLocale(request) ?? resolveAcceptLanguageLocale(request);
}

function getPathLocale(pathname: string): Locale | null {
  const [firstSegment = ""] = pathname.slice(1).split("/");

  return isLocale(firstSegment) ? firstSegment : null;
}

function shouldRedirectUnprefixedRoute(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  const [firstSegment] = pathname.slice(1).split("/");

  if (!firstSegment || firstSegment === INTERNAL_NOT_FOUND_SEGMENT || isLocale(firstSegment)) {
    return false;
  }

  return VALID_UNPREFIXED_ROOT_SEGMENTS.has(firstSegment);
}

function buildLocalizedPath(pathname: string, locale: Locale): string {
  if (locale === "uk") {
    return pathname;
  }

  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}

function withLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  locale: Locale,
): NextResponse {
  if (getCookieLocale(request) === locale) {
    return response;
  }

  response.cookies.set("NEXT_LOCALE", locale, { path: "/", sameSite: "lax" });

  return response;
}

function shouldRewriteToLocalizedNotFound(pathname: string): boolean {
  if (pathname === "/") {
    return false;
  }

  const [firstSegment] = pathname.slice(1).split("/");

  if (!firstSegment || firstSegment === INTERNAL_NOT_FOUND_SEGMENT) {
    return false;
  }

  if (isLocale(firstSegment)) {
    return false;
  }

  return !VALID_UNPREFIXED_ROOT_SEGMENTS.has(firstSegment);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = getPathLocale(pathname);
  const resolvedLocale = pathLocale ?? resolveRequestLocale(request);

  if (shouldRewriteToLocalizedNotFound(pathname)) {
    const rewriteUrl = request.nextUrl.clone();

    rewriteUrl.pathname = `/${resolvedLocale}/${INTERNAL_NOT_FOUND_SEGMENT}${pathname}`;

    return withLocaleCookie(request, NextResponse.rewrite(rewriteUrl), resolvedLocale);
  }

  if (!pathLocale && resolvedLocale === "en" && shouldRedirectUnprefixedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname = buildLocalizedPath(pathname, resolvedLocale);

    return withLocaleCookie(request, NextResponse.redirect(redirectUrl), resolvedLocale);
  }

  return withLocaleCookie(request, intlMiddleware(request), resolvedLocale);
}

export const config = {
  matcher: ["/", "/(uk|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
