import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "img-src 'self' data: blob: maps.googleapis.com maps.gstatic.com *.gstatic.com",
              "frame-src https://maps.google.com https://www.google.com",
              "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.supabase.co ws://localhost:* wss://localhost:* wss://*.supabase.co",
              "font-src 'self' fonts.gstatic.com data:",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
