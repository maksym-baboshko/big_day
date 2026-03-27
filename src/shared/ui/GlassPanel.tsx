import { SurfacePanel } from "./SurfacePanel";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function GlassPanel({ children, className, contentClassName }: GlassPanelProps) {
  return (
    <SurfacePanel
      className={className}
      contentClassName={contentClassName}
      tone="default"
      hoverable
    >
      {children}
    </SurfacePanel>
  );
}
