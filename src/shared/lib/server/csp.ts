/**
 * Build a Content-Security-Policy header value.
 * Extend as needed when adding new external resources.
 */
export function buildCsp(nonce?: string): string {
  const scriptSrc = nonce ? `'nonce-${nonce}' 'strict-dynamic'` : "'self'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "frame-src https://www.google.com",
    "connect-src 'self' https://*.supabase.co",
  ].join("; ");
}
