import { cn } from "@/shared/lib/cn";

type SectionShellBackground = "primary" | "secondary" | "transparent";
type SectionShellPadding = "default" | "compact" | "none";
type SectionShellContentWidth = "narrow" | "wide" | "full";

interface SectionShellProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  contentClassName?: string;
  background?: SectionShellBackground;
  padding?: SectionShellPadding;
  contentWidth?: SectionShellContentWidth;
  fullHeight?: boolean;
  fadeEdges?: boolean;
}

const backgroundClasses: Record<SectionShellBackground, string> = {
  primary: "bg-bg-primary",
  secondary: "bg-bg-secondary",
  transparent: "bg-transparent",
};

const paddingClasses: Record<SectionShellPadding, string> = {
  default: "px-[var(--section-shell-padding-x)] py-[var(--section-shell-padding-y)] md:px-8",
  compact:
    "px-[var(--section-shell-padding-x)] py-[var(--section-shell-padding-y-compact)] md:px-8",
  none: "",
};

const contentWidthClasses: Record<SectionShellContentWidth, string> = {
  narrow: "max-w-4xl",
  wide: "max-w-6xl",
  full: "max-w-none",
};

export function SectionShell({
  children,
  id,
  className,
  contentClassName,
  background = "primary",
  padding = "default",
  contentWidth = "narrow",
  fullHeight = false,
  fadeEdges = true,
}: SectionShellProps) {
  const fadeBase =
    background === "secondary"
      ? "from-bg-secondary"
      : background === "transparent"
        ? "from-bg-primary"
        : "from-bg-primary";

  return (
    <section
      id={id}
      className={cn(
        "relative w-full overflow-hidden",
        backgroundClasses[background],
        paddingClasses[padding],
        fullHeight && "flex min-h-screen flex-col items-center justify-center",
        className,
      )}
    >
      {fadeEdges ? (
        <>
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-linear-to-b to-transparent md:h-20",
              fadeBase,
            )}
          />
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-linear-to-t to-transparent md:h-20",
              fadeBase,
            )}
          />
        </>
      ) : null}
      <div className={cn("mx-auto w-full", contentWidthClasses[contentWidth], contentClassName)}>
        {children}
      </div>
    </section>
  );
}
