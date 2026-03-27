import { cn } from "@/shared/lib";
import { SurfacePanel } from "@/shared/ui";

interface FeedStatePanelProps {
  children: React.ReactNode;
  className?: string;
}

export function FeedStatePanel({ children, className }: FeedStatePanelProps) {
  return (
    <SurfacePanel
      tone="subtle"
      className={cn("relative min-h-[620px] lg:min-h-0 lg:flex-1", className)}
      contentClassName="relative flex h-full flex-col items-center justify-center overflow-hidden px-8 py-16 text-center"
    >
      {children}
    </SurfacePanel>
  );
}
