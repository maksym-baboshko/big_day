import { cn } from "@/shared/lib/cn";

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
      {eyebrow ? <p className={cn("section-eyebrow mb-4", eyebrowClassName)}>{eyebrow}</p> : null}
      <h2 className={cn("section-title mb-3", titleClassName)}>{children}</h2>
      {subtitle && <p className={cn("section-subtitle", subtitleClassName)}>{subtitle}</p>}
      <hr className={cn("section-rule mt-6 w-24", isCentered && "mx-auto", ruleClassName)} />
    </div>
  );
}
