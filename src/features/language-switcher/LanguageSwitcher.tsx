"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/shared/i18n/navigation";
import { useTransition, useSyncExternalStore } from "react";
import { cn } from "@/shared/lib";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Accessibility");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const toggleLocale = () => {
    const nextLocale = locale === "uk" ? "en" : "uk";
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  if (!mounted) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full border border-accent text-sm font-medium opacity-0",
          "bg-bg-primary text-text-primary"
        )}
        aria-label={locale === "uk" ? t("switch_language_to_en") : t("switch_language_to_uk")}
      >
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full border border-accent text-sm font-medium transition-all duration-300 cursor-pointer select-none",
        "bg-bg-primary text-text-primary hover:bg-accent hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
        isPending && "opacity-70"
      )}
      aria-label={locale === "uk" ? t("switch_language_to_en") : t("switch_language_to_uk")}
    >
      <span className="pointer-events-none">
        {locale === "uk" ? "EN" : "UA"}
      </span>
    </button>
  );
}
