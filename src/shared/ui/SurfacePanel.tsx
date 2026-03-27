import { cn } from "@/shared/lib";

type SurfacePanelTone = "default" | "subtle" | "highlighted";

interface SurfacePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: SurfacePanelTone;
  hoverable?: boolean;
}

const toneClasses: Record<SurfacePanelTone, string> = {
  default:
    "rounded-[var(--surface-radius-panel)] border border-accent/24 shadow-[var(--shadow-surface-floating)]",
  subtle:
    "rounded-[var(--surface-radius-card)] border border-accent/18 shadow-[var(--shadow-surface-soft)]",
  highlighted:
    "rounded-[var(--surface-radius-card)] border border-accent/22 shadow-[var(--shadow-surface-soft)]",
};

const toneFillClasses: Record<SurfacePanelTone, string> = {
  default: "bg-bg-primary/72",
  subtle: "bg-bg-secondary/32",
  highlighted: "bg-linear-to-br from-accent/12 via-bg-primary/78 to-accent/6",
};

const toneBlurClasses: Record<SurfacePanelTone, string> = {
  default: "backdrop-blur-[var(--surface-blur-default)]",
  subtle: "backdrop-blur-[var(--surface-blur-subtle)]",
  highlighted: "backdrop-blur-[var(--surface-blur-subtle)]",
};

export function SurfacePanel({
  children,
  className,
  contentClassName,
  tone = "default",
  hoverable = false,
  ...props
}: SurfacePanelProps) {
  return (
    <div
      {...props}
      className={cn(
        "group/surface relative isolate overflow-hidden transition-colors duration-500",
        toneClasses[tone],
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-0 rounded-[inherit]",
          toneFillClasses[tone],
          toneBlurClasses[tone],
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20 rounded-[inherit] border border-accent/0 transition-colors duration-500",
          hoverable && "group-hover/surface:border-accent/40",
        )}
      />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}
