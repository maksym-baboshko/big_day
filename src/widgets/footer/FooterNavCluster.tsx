export interface FooterNavClusterItem {
  href: string;
  label: string;
}

interface FooterNavClusterProps {
  items: FooterNavClusterItem[];
  ariaLabel: string;
}

export function FooterNavCluster({ items, ariaLabel }: FooterNavClusterProps) {
  return (
    <div className="w-full max-w-3xl px-4 py-3 md:px-5">
      <nav aria-label={ariaLabel}>
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {items.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="rounded-sm px-1 py-0.5 text-[9px] uppercase tracking-[0.2em] text-text-secondary/90 transition-colors duration-300 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary md:text-[10px]"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
