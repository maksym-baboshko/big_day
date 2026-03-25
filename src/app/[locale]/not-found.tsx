import { useTranslations } from "next-intl";
import Link from "next/link";

export default function LocaleNotFound() {
  // t is available here because this renders inside the [locale] layout
  // which provides NextIntlClientProvider
  const t = useTranslations("NotFoundPage");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-cinzel text-6xl font-bold opacity-20">404</p>
      <h1 className="heading-serif text-3xl">{t("title")}</h1>
      <p className="text-text-secondary">{t("description")}</p>
      <Link href="/" className="underline underline-offset-4">
        {t("backHome")}
      </Link>
    </div>
  );
}
