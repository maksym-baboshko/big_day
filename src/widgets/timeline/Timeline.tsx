import { cn } from "@/shared/lib";
import { AnimatedReveal, SectionHeading, SectionWrapper } from "@/shared/ui";
import { getTranslations } from "next-intl/server";

const EVENT_KEYS = [
  "ceremony",
  "photo_session",
  "banquet",
  "activities",
  "cake",
  "sparklers",
] as const;

type EventKey = (typeof EVENT_KEYS)[number];

export async function Timeline() {
  const t = await getTranslations("Timeline");

  return (
    <SectionWrapper id="timeline">
      <div className="mx-auto max-w-4xl">
        <AnimatedReveal direction="up">
          <SectionHeading subtitle={t("subtitle")} align="center">
            {t("title")}
          </SectionHeading>
        </AnimatedReveal>

        {/* Timeline */}
        <div className="relative mt-12">
          {/* Central vertical line (desktop only) */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-accent/20 md:block" />

          <div className="flex flex-col gap-10">
            {EVENT_KEYS.map((key, i) => {
              const isLeft = i % 2 === 0;
              return (
                <AnimatedReveal key={key} direction={isLeft ? "right" : "left"} delay={0.05 * i}>
                  <div
                    className={cn(
                      "relative flex items-center gap-6",
                      "md:gap-0",
                      isLeft ? "md:flex-row" : "md:flex-row-reverse",
                    )}
                  >
                    {/* Card */}
                    <div
                      className={cn(
                        "flex-1 rounded-2xl border border-accent/15 bg-bg-primary p-6 shadow-sm",
                        "md:max-w-[calc(50%-2rem)]",
                        isLeft ? "md:mr-auto md:text-right" : "md:ml-auto md:text-left",
                      )}
                    >
                      <p className="font-cinzel mb-1 text-sm font-bold tracking-widest text-accent">
                        {t(`events.${key}.time` as `events.${EventKey}.time`)}
                      </p>
                      <h3 className="heading-serif mb-1 text-lg">
                        {t(`events.${key}.title` as `events.${EventKey}.title`)}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {t(`events.${key}.description` as `events.${EventKey}.description`)}
                      </p>
                    </div>

                    {/* Center dot (desktop) */}
                    <div className="absolute left-1/2 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-accent bg-bg-primary md:block" />
                  </div>
                </AnimatedReveal>
              );
            })}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
