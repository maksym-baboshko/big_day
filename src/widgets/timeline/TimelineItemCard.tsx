import { SurfacePanel } from "@/shared/ui";

interface TimelineItemCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function TimelineItemCard({ icon, title, description }: TimelineItemCardProps) {
  return (
    <SurfacePanel tone="subtle" hoverable contentClassName="px-5 py-5 md:px-6 md:py-6">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors duration-300 group-hover/surface:bg-accent/20">
          {icon}
        </div>
        <h3 className="heading-serif text-xl text-text-primary transition-colors duration-300 group-hover/surface:text-accent md:text-2xl">
          {title}
        </h3>
      </div>
      <p className="pl-10 text-sm leading-relaxed text-text-secondary md:text-base">
        {description}
      </p>
    </SurfacePanel>
  );
}
