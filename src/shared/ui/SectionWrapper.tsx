import { SectionShell } from "./SectionShell";

interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  alternate?: boolean;
  noPadding?: boolean;
  fullHeight?: boolean;
  noFade?: boolean;
}

export function SectionWrapper({
  children,
  id,
  className,
  alternate = false,
  noPadding = false,
  fullHeight = false,
  noFade = false,
}: SectionWrapperProps) {
  return (
    <SectionShell
      id={id}
      className={className}
      background={alternate ? "secondary" : "primary"}
      padding={noPadding ? "none" : "default"}
      contentWidth={noPadding ? "full" : "narrow"}
      fullHeight={fullHeight}
      fadeEdges={!noFade}
    >
      {children}
    </SectionShell>
  );
}
