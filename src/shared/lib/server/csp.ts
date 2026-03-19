import type { Locale } from "@/shared/i18n/routing";
import { getStructuredDataJson } from "@/shared/config";
import { THEME_INIT_SCRIPT } from "../theme-script";

const isVercelPreview = process.env.VERCEL_ENV === "preview";
const vercelToolbarScriptSources = "https://vercel.live";
const vercelToolbarConnectSources = "https://vercel.live wss://ws-us3.pusher.com";
const vercelToolbarImgSources = "https://vercel.live https://vercel.com";
const vercelToolbarStyleSources = "https://vercel.live";
const vercelToolbarFrameSources = "https://vercel.live";
const vercelToolbarFontSources = "https://assets.vercel.com";

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
  const previewScriptSources = isVercelPreview
    ? ` ${vercelToolbarScriptSources}`
    : "";
  const previewConnectSources = isVercelPreview
    ? ` ${vercelToolbarConnectSources}`
    : "";
  const previewImgSources = isVercelPreview ? ` ${vercelToolbarImgSources}` : "";
  const previewStyleSources = isVercelPreview
    ? ` ${vercelToolbarStyleSources}`
    : "";
  const previewFrameSources = isVercelPreview
    ? ` ${vercelToolbarFrameSources}`
    : "";
  const previewFontSources = isVercelPreview
    ? ` ${vercelToolbarFontSources}`
    : "";

  if (process.env.NODE_ENV === "development") {
    const devScriptSources = `'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com${previewScriptSources}`;

    return [
      "default-src 'self'",
      `script-src ${devScriptSources}`,
      `script-src-elem ${devScriptSources}`,
      `style-src 'self' 'unsafe-inline' fonts.googleapis.com${previewStyleSources}`,
      `img-src 'self' data: blob: maps.googleapis.com maps.gstatic.com *.gstatic.com${previewImgSources}`,
      `frame-src https://maps.google.com https://www.google.com${previewFrameSources}`,
      `connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com ws://localhost:* wss://localhost:* wss://*.supabase.co${previewConnectSources}`,
      `font-src 'self' fonts.gstatic.com data:${previewFontSources}`,
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; ");
  }

  const [themeScriptHash, structuredDataHash] = await Promise.all([
    themeScriptHashPromise,
    getStructuredDataHash(locale),
  ]);
  const scriptSources = `'self' 'unsafe-inline' ${themeScriptHash} ${structuredDataHash} https://va.vercel-scripts.com https://vitals.vercel-insights.com${previewScriptSources}`;

  return [
    "default-src 'self'",
    // Static App Router pages emit multiple inline hydration scripts at build time.
    // Allowing inline scripts here keeps prerendered pages compatible with CSP.
    `script-src ${scriptSources}`,
    `script-src-elem ${scriptSources}`,
    `style-src 'self' 'unsafe-inline' fonts.googleapis.com${previewStyleSources}`,
    `img-src 'self' data: blob: maps.googleapis.com maps.gstatic.com *.gstatic.com${previewImgSources}`,
    `frame-src https://maps.google.com https://www.google.com${previewFrameSources}`,
    `connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com wss://*.supabase.co${previewConnectSources}`,
    `font-src 'self' fonts.gstatic.com data:${previewFontSources}`,
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}
