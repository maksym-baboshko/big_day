import { AnimatedReveal, SectionHeading, SectionWrapper } from "@/shared/ui";
import { getTranslations } from "next-intl/server";

export async function OurStory() {
  const t = await getTranslations("OurStory");

  const paragraphs = [t("story_p1"), t("story_p2"), t("story_p3"), t("story_p4")] as const;

  return (
    <SectionWrapper id="story" alternate>
      <div className="mx-auto max-w-4xl">
        <AnimatedReveal direction="up">
          <SectionHeading subtitle={t("subtitle")} align="center">
            {t("title")}
          </SectionHeading>
        </AnimatedReveal>

        {/* Couple names */}
        <AnimatedReveal direction="up" delay={0.1}>
          <div className="mb-12 flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent/30 bg-bg-primary">
                <span className="font-cinzel text-2xl font-bold text-accent">
                  {t("groom_name")[0]}
                </span>
              </div>
              <p className="font-cinzel text-sm uppercase tracking-wider text-text-secondary">
                {t("groom_name")}
              </p>
              <p className="text-xs text-text-secondary/70">{t("groom_bio")}</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-16 w-px bg-accent/20" />
              <span className="my-2 font-cinzel text-accent">&</span>
              <div className="h-16 w-px bg-accent/20" />
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent/30 bg-bg-primary">
                <span className="font-cinzel text-2xl font-bold text-accent">
                  {t("bride_name")[0]}
                </span>
              </div>
              <p className="font-cinzel text-sm uppercase tracking-wider text-text-secondary">
                {t("bride_name")}
              </p>
              <p className="text-xs text-text-secondary/70">{t("bride_bio")}</p>
            </div>
          </div>
        </AnimatedReveal>

        {/* Story heading */}
        <AnimatedReveal direction="up" delay={0.15}>
          <h3 className="heading-serif-italic mb-8 text-center text-2xl text-text-secondary">
            {t("how_we_met_title")}
          </h3>
        </AnimatedReveal>

        {/* Story paragraphs */}
        <div className="flex flex-col gap-5">
          {paragraphs.map((text, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static ordered paragraphs
            <AnimatedReveal key={i} direction="up" delay={0.05 * i}>
              <p
                className={
                  i === 0
                    ? "text-text-primary leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:font-cinzel first-letter:text-5xl first-letter:font-bold first-letter:leading-none first-letter:text-accent"
                    : "text-text-primary leading-relaxed"
                }
              >
                {text}
              </p>
            </AnimatedReveal>
          ))}
        </div>

        {/* Closing quote */}
        <AnimatedReveal direction="up" delay={0.2}>
          <p className="heading-serif-italic mt-10 text-center text-xl text-accent">
            — {t("story_closing")}
          </p>
        </AnimatedReveal>
      </div>
    </SectionWrapper>
  );
}
