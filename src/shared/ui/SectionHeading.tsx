"use client";

import { cn } from "@/shared/lib/cn";
import { InViewReveal } from "./InViewReveal";

interface SectionHeadingProps {
  children: React.ReactNode;
  eyebrow?: string;
  subtitle?: string;
  className?: string;
  align?: "center" | "left";
  titleClassName?: string;
  subtitleClassName?: string;
  eyebrowClassName?: string;
  ruleClassName?: string;
}

export function SectionHeading({
  children,
  eyebrow,
  subtitle,
  className,
  align = "center",
  titleClassName,
  subtitleClassName,
  eyebrowClassName,
  ruleClassName,
}: SectionHeadingProps) {
  const isCentered = align === "center";

  return (
    <div className={cn("mb-[var(--section-heading-gap)]", isCentered && "text-center", className)}>
      {eyebrow ? (
        <InViewReveal delay={0.04} duration={0.5}>
          <p className={cn("section-eyebrow mb-4", eyebrowClassName)}>{eyebrow}</p>
        </InViewReveal>
      ) : null}
      <InViewReveal delay={eyebrow ? 0.08 : 0.04} duration={0.65}>
        <h2 className={cn("section-title mb-3", titleClassName)}>{children}</h2>
      </InViewReveal>
      {subtitle ? (
        <InViewReveal delay={eyebrow ? 0.14 : 0.1} duration={0.55}>
          <p className={cn("section-subtitle", subtitleClassName)}>{subtitle}</p>
        </InViewReveal>
      ) : null}
      <InViewReveal delay={subtitle ? 0.2 : eyebrow ? 0.14 : 0.1} duration={0.5}>
        <hr className={cn("section-rule mt-6 w-24", isCentered && "mx-auto", ruleClassName)} />
      </InViewReveal>
    </div>
  );
}
