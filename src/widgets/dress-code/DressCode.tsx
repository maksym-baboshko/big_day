import { DRESS_CODE } from "@/shared/config";
import type { Locale } from "@/shared/i18n/routing";
import { AnimatedReveal, SectionHeading, SectionWrapper } from "@/shared/ui";
import { getLocale, getTranslations } from "next-intl/server";

interface SwatchProps {
  hex: string;
  name: string;
}

function Swatch({ hex, name }: SwatchProps) {
  return (
    <div className="group flex flex-col items-center gap-2">
      <div
        className="relative h-16 w-16 cursor-default rounded-full border-2 border-white/20 shadow-md transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20"
        style={{ backgroundColor: hex }}
        aria-label={name}
      >
        {/* Hex reveal on hover */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-white">
            {hex}
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-text-secondary">{name}</p>
    </div>
  );
}

export async function DressCode() {
  const t = await getTranslations("DressCode");
  const locale = (await getLocale()) as Locale;

  return (
    <SectionWrapper id="dress-code">
      <div className="mx-auto max-w-4xl">
        <AnimatedReveal direction="up">
          <SectionHeading subtitle={t("subtitle")} align="center">
            {t("title")}
          </SectionHeading>
        </AnimatedReveal>

        <div className="mt-12 grid gap-12 md:grid-cols-2">
          {/* Ladies */}
          <AnimatedReveal direction="right">
            <div>
              <h3 className="heading-serif mb-1 text-center text-xl">{t("ladies_title")}</h3>
              <p className="mb-6 text-center text-sm italic text-text-secondary">
                {t("ladies_note")}
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                {DRESS_CODE.ladies.map((swatch) => (
                  <Swatch
                    key={swatch.hex}
                    hex={swatch.hex}
                    name={locale === "uk" ? swatch.name.uk : swatch.name.en}
                  />
                ))}
              </div>
            </div>
          </AnimatedReveal>

          {/* Gentlemen */}
          <AnimatedReveal direction="left">
            <div>
              <h3 className="heading-serif mb-1 text-center text-xl">{t("gentlemen_title")}</h3>
              <p className="mb-6 text-center text-sm italic text-text-secondary">
                {t("gentlemen_note")}
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                {DRESS_CODE.gentlemen.map((swatch) => (
                  <Swatch
                    key={swatch.hex}
                    hex={swatch.hex}
                    name={locale === "uk" ? swatch.name.uk : swatch.name.en}
                  />
                ))}
              </div>
            </div>
          </AnimatedReveal>
        </div>
      </div>
    </SectionWrapper>
  );
}
