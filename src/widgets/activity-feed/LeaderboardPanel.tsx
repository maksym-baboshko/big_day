import { SurfacePanel } from "@/shared/ui";

interface LeaderboardPanelProps {
  children: React.ReactNode;
  eyebrow: string;
  className?: string;
}

export function LeaderboardPanel({ children, eyebrow, className }: LeaderboardPanelProps) {
  return (
    <SurfacePanel tone="subtle" className={className} contentClassName="p-4 md:p-5">
      <p className="surface-panel-label mb-4 text-left">{eyebrow}</p>
      {children}
    </SurfacePanel>
  );
}
