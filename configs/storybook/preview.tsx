import { ThemeProvider } from "@/features/theme-switcher";
import enMessages from "@/shared/i18n/translations/en.json";
import ukMessages from "@/shared/i18n/translations/uk.json";
import { cinzel, inter, playfair, vibes } from "@/shared/lib";
import type { Preview } from "@storybook/nextjs-vite";
import { MotionConfig } from "motion/react";
import "@/app/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useEffect } from "react";

const THEME_STORAGE_KEY = "theme" as const;
const fontClassName = `${inter.variable} ${playfair.variable} ${cinzel.variable} ${vibes.variable} font-inter antialiased`;

const messagesByLocale = {
  en: enMessages,
  uk: ukMessages,
} as const;

type StorybookLocale = keyof typeof messagesByLocale;
type StorybookTheme = "light" | "dark";
type StorybookMotion = "default" | "reduce";

let originalMatchMedia: typeof window.matchMedia | null = null;

function createMediaQueryList(query: string, matches: boolean): MediaQueryList {
  return {
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    addListener: () => undefined,
    dispatchEvent: () => false,
    removeEventListener: () => undefined,
    removeListener: () => undefined,
  } as MediaQueryList;
}

interface StorybookShellProps {
  children: ReactNode;
  locale: StorybookLocale;
  motion: StorybookMotion;
  theme: StorybookTheme;
}

function applyStorybookEnvironment(
  locale: StorybookLocale,
  motion: StorybookMotion,
  theme: StorybookTheme,
): void {
  if (typeof window === "undefined") {
    return;
  }

  originalMatchMedia ??= window.matchMedia.bind(window);

  document.documentElement.lang = locale;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.scrollBehavior = motion === "reduce" ? "auto" : "smooth";
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);

  window.matchMedia = (query: string) => {
    if (query === "(prefers-color-scheme: dark)") {
      return createMediaQueryList(query, theme === "dark");
    }

    if (query === "(prefers-reduced-motion: reduce)") {
      return createMediaQueryList(query, motion === "reduce");
    }

    return (originalMatchMedia ?? window.matchMedia)(query);
  };
}

function StorybookShell({ children, locale, motion, theme }: StorybookShellProps) {
  applyStorybookEnvironment(locale, motion, theme);

  useEffect(() => {
    return () => {
      if (originalMatchMedia && typeof window !== "undefined") {
        window.matchMedia = originalMatchMedia;
      }
    };
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      <MotionConfig reducedMotion={motion === "reduce" ? "always" : "never"}>
        <ThemeProvider>
          <div className={fontClassName}>{children}</div>
        </ThemeProvider>
      </MotionConfig>
    </NextIntlClientProvider>
  );
}

const preview: Preview = {
  decorators: [
    (Story, context) => (
      <StorybookShell
        locale={(context.globals.locale as StorybookLocale | undefined) ?? "uk"}
        motion={(context.globals.motion as "default" | "reduce" | undefined) ?? "default"}
        theme={(context.globals.theme as StorybookTheme | undefined) ?? "light"}
      >
        <Story />
      </StorybookShell>
    ),
  ],
  globalTypes: {
    locale: {
      name: "Locale",
      toolbar: {
        icon: "globe",
        dynamicTitle: true,
        items: [
          { value: "uk", title: "Ukrainian" },
          { value: "en", title: "English" },
        ],
      },
    },
    theme: {
      name: "Theme",
      toolbar: {
        icon: "mirror",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
    motion: {
      name: "Motion",
      toolbar: {
        icon: "transfer",
        dynamicTitle: true,
        items: [
          { value: "default", title: "Default" },
          { value: "reduce", title: "Reduced" },
        ],
      },
    },
  },
  initialGlobals: {
    locale: "uk",
    motion: "default",
    theme: "light",
  },
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/",
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "canvas",
      values: [
        { name: "canvas", value: "#faf6f0" },
        { name: "night", value: "#1a1614" },
      ],
    },
    chromatic: {
      viewports: [390, 1280],
    },
  },
  tags: ["autodocs"],
};

export default preview;
