import { cn } from "@/shared/lib";
import { SurfacePanel } from "@/shared/ui";

interface InvitationSummaryCardProps {
  label: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  tone?: "subtle" | "highlighted";
}

export function InvitationSummaryCard({
  label,
  title,
  children,
  description,
  className,
  tone = "subtle",
}: InvitationSummaryCardProps) {
  return (
    <SurfacePanel tone={tone} className={cn("h-full", className)} contentClassName="h-full p-6">
      <p className="surface-panel-label">{label}</p>
      <div className="mt-5">{title}</div>
      {children ? <div className="mt-5">{children}</div> : null}
      {description ? (
        <p className="mt-5 text-sm leading-relaxed text-bg-primary/66 dark:text-text-secondary">
          {description}
        </p>
      ) : null}
    </SurfacePanel>
  );
}
