import type { Locale } from "@/shared/i18n/routing";
import { getStructuredDataJson } from "@/shared/config";
import { THEME_INIT_SCRIPT } from "../theme-script";

function toBase64(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary);
}

async function sha256SourceHash(source: string) {
  const encoded = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return `'sha256-${toBase64(new Uint8Array(digest))}'`;
}

const themeScriptHashPromise = sha256SourceHash(THEME_INIT_SCRIPT);
const structuredDataHashPromises = new Map<Locale, Promise<string>>();

function getStructuredDataHash(locale: Locale) {
  const existingPromise = structuredDataHashPromises.get(locale);

  if (existingPromise) {
    return existingPromise;
  }

  const nextPromise = sha256SourceHash(getStructuredDataJson(locale));
  structuredDataHashPromises.set(locale, nextPromise);
  return nextPromise;
}

export async function buildContentSecurityPolicy(locale: Locale) {
  if (process.env.NODE_ENV === "development") {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: blob: maps.googleapis.com maps.gstatic.com *.gstatic.com",
      "frame-src https://maps.google.com https://www.google.com",
      "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com ws://localhost:* wss://localhost:* wss://*.supabase.co",
      "font-src 'self' fonts.gstatic.com data:",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");
  }

  const [themeScriptHash, structuredDataHash] = await Promise.all([
    themeScriptHashPromise,
    getStructuredDataHash(locale),
  ]);

  return [
    "default-src 'self'",
    `script-src 'self' ${themeScriptHash} ${structuredDataHash} https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "img-src 'self' data: blob: maps.googleapis.com maps.gstatic.com *.gstatic.com",
    "frame-src https://maps.google.com https://www.google.com",
    "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com wss://*.supabase.co",
    "font-src 'self' fonts.gstatic.com data:",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}
