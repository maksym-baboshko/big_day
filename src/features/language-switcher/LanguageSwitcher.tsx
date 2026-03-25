"use client";

import { usePathname, useRouter } from "@/shared/i18n/navigation";
import { cn } from "@/shared/lib";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Accessibility");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return <span className={cn("w-8 h-4 inline-block", className)} />;
  }

  const otherLocale = locale === "uk" ? "en" : "uk";
  const label = locale === "uk" ? t("switch_language_to_en") : t("switch_language_to_uk");
  const displayLabel = otherLocale === "en" ? "EN" : "УК";

  function handleSwitch() {
    router.replace(pathname, { locale: otherLocale });
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      aria-label={label}
      className={cn(
        "font-cinzel text-sm uppercase tracking-wider text-text-secondary transition-colors duration-200 hover:text-accent",
        className,
      )}
    >
      {displayLabel}
    </button>
  );
}
