import localFont from "next/font/local";

export const inter = localFont({
  src: "./font-files/Inter-Variable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const playfair = localFont({
  src: [
    {
      path: "./font-files/PlayfairDisplay-Variable.woff2",
      style: "normal",
    },
    {
      path: "./font-files/PlayfairDisplay-Italic-Variable.woff2",
      style: "italic",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
});

export const cinzel = localFont({
  src: "./font-files/Cinzel-Variable.woff2",
  variable: "--font-cinzel",
  display: "swap",
});

export const vibes = localFont({
  src: "./font-files/GreatVibes-Regular.woff2",
  variable: "--font-vibes",
  display: "swap",
  weight: "400",
});
