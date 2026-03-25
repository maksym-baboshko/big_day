import { AnimatedReveal, SectionHeading, SectionWrapper } from "@/shared/ui";
import { getTranslations } from "next-intl/server";

function EnvelopeSvg() {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-20 w-auto text-accent/60"
      aria-hidden="true"
      role="presentation"
    >
      {/* Envelope body */}
      <rect
        x="2"
        y="2"
        width="116"
        height="76"
        rx="6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Envelope flap */}
      <path d="M2 2 L60 46 L118 2" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Bottom lines */}
      <line x1="2" y1="78" x2="40" y2="44" stroke="currentColor" strokeWidth="1.5" />
      <line x1="118" y1="78" x2="80" y2="44" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export async function Gifts() {
  const t = await getTranslations("Gifts");

  return (
    <SectionWrapper id="gifts" alternate>
      <div className="mx-auto max-w-2xl text-center">
        <AnimatedReveal direction="up">
          <SectionHeading subtitle={t("subtitle")} align="center">
            {t("title")}
          </SectionHeading>
        </AnimatedReveal>

        <AnimatedReveal direction="up" delay={0.1}>
          <div className="mb-6 flex justify-center">
            <EnvelopeSvg />
          </div>
        </AnimatedReveal>

        <AnimatedReveal direction="up" delay={0.15}>
          <p className="mb-4 text-text-secondary leading-relaxed">{t("intro")}</p>
          <p className="mb-8 text-text-secondary leading-relaxed">{t("details")}</p>
        </AnimatedReveal>

        {/* Amount cards */}
        <AnimatedReveal direction="up" delay={0.2}>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-accent/20 bg-bg-primary p-6">
              <p className="font-cinzel mb-1 text-xs uppercase tracking-widest text-text-secondary">
                {t("suggested")}
              </p>
              <p className="font-cinzel text-3xl font-bold text-accent">1000+</p>
              <p className="font-cinzel mt-1 text-sm text-text-secondary">NOK · {t("per_guest")}</p>
            </div>
            <div className="rounded-2xl border border-accent/20 bg-bg-primary p-6">
              <p className="font-cinzel mb-1 text-xs uppercase tracking-widest text-text-secondary">
                {t("from")}
              </p>
              <p className="font-cinzel text-3xl font-bold text-accent">500</p>
              <p className="font-cinzel mt-1 text-sm text-text-secondary">NOK · {t("per_guest")}</p>
            </div>
          </div>
        </AnimatedReveal>

        <AnimatedReveal direction="up" delay={0.25}>
          <p className="text-sm italic text-text-secondary">{t("closing")}</p>
        </AnimatedReveal>
      </div>
    </SectionWrapper>
  );
}
