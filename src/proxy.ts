import type { Locale } from "@/shared/i18n/routing";
import { isLocale, routing } from "@/shared/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const INTERNAL_NOT_FOUND_SEGMENT = "__not-found";
const VALID_UNPREFIXED_ROOT_SEGMENTS = new Set(["invite", "live"]);

function resolveRequestLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;

  return cookieLocale === "en" ? "en" : "uk";
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
  if (shouldRewriteToLocalizedNotFound(request.nextUrl.pathname)) {
    const locale = resolveRequestLocale(request);
    const rewriteUrl = request.nextUrl.clone();

    rewriteUrl.pathname = `/${locale}/${INTERNAL_NOT_FOUND_SEGMENT}${request.nextUrl.pathname}`;

    return NextResponse.rewrite(rewriteUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(uk|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
