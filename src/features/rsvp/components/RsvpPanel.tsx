import { cn } from "@/shared/lib";
interface RsvpPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function RsvpPanel({ children, className }: RsvpPanelProps) {
  return (
    <div
      className={cn(
        "group/surface relative isolate overflow-hidden rounded-[var(--surface-radius-panel)] border border-accent/24 shadow-[var(--shadow-surface-floating)] transition-colors duration-500",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-linear-to-r from-bg-primary/62 via-bg-primary/58 to-bg-primary/54 backdrop-blur-[var(--surface-blur-default)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-linear-to-r from-bg-primary/28 via-bg-primary/24 to-bg-primary/20 backdrop-blur-[22px]"
        style={{ opacity: "var(--rsvp-panel-blur-strength, 1)" }}
      />
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border border-accent/0 transition-colors duration-500 group-hover/surface:border-accent/40" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent/20 blur-[100px]" />
      <div className="relative z-10 p-6 md:p-12">{children}</div>
    </div>
  );
}
