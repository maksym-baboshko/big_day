import { ThemeProvider } from "@/features/theme-switcher";
import { resolveLocale } from "@/shared/i18n/routing";
import { NotFoundPage, getNotFoundPageContent } from "@/widgets/not-found";
import { cookies } from "next/headers";

export default async function RootNotFound() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value ?? "");
  const content = getNotFoundPageContent(locale);

  return (
    <ThemeProvider>
      <NotFoundPage locale={locale} content={content} />
    </ThemeProvider>
  );
}
