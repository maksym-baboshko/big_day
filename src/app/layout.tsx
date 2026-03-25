import { COUPLE, SITE_NAME, VENUE } from "@/shared/config";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: `${COUPLE.groom.name.en} & ${COUPLE.bride.name.en}'s Wedding · ${VENUE.locationShort}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
