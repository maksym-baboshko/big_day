import type { ReactNode } from "react";

interface FooterSignatureBlockProps {
  venueLabel: string;
  groomName: string;
  brideName: string;
  romanDate: string;
  venueName: string;
  separator?: ReactNode;
}

export function FooterSignatureBlock({
  venueLabel,
  groomName,
  brideName,
  romanDate,
  venueName,
  separator,
}: FooterSignatureBlockProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="block h-px w-10 bg-linear-to-r from-transparent to-accent/35" />
        <span className="text-[9px] font-medium uppercase tracking-[0.35em] text-text-secondary/90">
          {venueLabel}
        </span>
        <span className="block h-px w-10 bg-linear-to-l from-transparent to-accent/35" />
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="heading-serif text-[2.5rem] leading-none tracking-tight text-text-primary md:text-[4.25rem]">
          {groomName}
          <span className="heading-serif-italic mx-3 text-[2rem] text-accent md:mx-5 md:text-[3.25rem]">
            &amp;
          </span>
          {brideName}
        </h2>

        <p className="mt-1 font-cinzel text-[0.6rem] uppercase tracking-[0.45em] text-text-secondary/90 md:text-[0.7rem]">
          {romanDate}
        </p>

        <p className="mt-0.5 text-xs tracking-wider text-text-secondary/90">{venueName}</p>
      </div>

      {separator ?? (
        <div className="flex w-full max-w-[12rem] items-center gap-3">
          <div className="h-px flex-1 bg-linear-to-r from-transparent to-accent/35" />
          <svg
            width="7"
            height="7"
            viewBox="0 0 7 7"
            className="shrink-0 rotate-45 text-accent/45"
            aria-hidden="true"
          >
            <rect width="7" height="7" fill="currentColor" />
          </svg>
          <div className="h-px flex-1 bg-linear-to-l from-transparent to-accent/35" />
        </div>
      )}
    </>
  );
}
