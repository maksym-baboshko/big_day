"use client";

import type { MouseEvent, ReactNode, Ref } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { LanguageSwitcher } from "@/features/language-switcher";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Link } from "@/shared/i18n/navigation";
import { MOTION_EASE, cn, useLiteMotion } from "@/shared/lib";
import { Ornament } from "@/shared/ui";
import { AnimatePresence, motion } from "motion/react";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

function getScrollSnapshot() {
  return window.scrollY > 20;
}

function getServerScrollSnapshot() {
  return false;
}

export interface HeaderNavItem {
  href: string;
  label: string;
  kind: "route" | "anchor";
  active?: boolean;
  onSelect?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

interface HeaderFrameProps {
  items: HeaderNavItem[];
  mobileItems?: HeaderNavItem[];
  logo: HeaderNavItem;
  desktopNavLabel: string;
  mobileNavLabel: string;
  openMenuLabel: string;
  closeMenuLabel: string;
  mobileMeta: {
    left: string;
    right: string;
  };
  showSkipLink?: boolean;
  skipLinkLabel?: string;
  skipTargetId?: string;
  onSkipToContent?: () => void;
  mainContentId?: string;
  footerId?: string;
}

interface HeaderLinkOptions {
  item: HeaderNavItem;
  className: string;
  children: ReactNode;
  onAfterSelect?: () => void;
  ref?: Ref<HTMLAnchorElement>;
}

function renderHeaderLink({ item, className, children, onAfterSelect, ref }: HeaderLinkOptions) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    item.onSelect?.(event);
    onAfterSelect?.();
  };

  const sharedProps = {
    href: item.href,
    onClick: handleClick,
    className,
    "aria-current": item.active ? ("page" as const) : undefined,
  };

  if (item.kind === "anchor") {
    return (
      <a ref={ref} {...sharedProps}>
        {children}
      </a>
    );
  }

  return (
    <Link ref={ref} {...sharedProps}>
      {children}
    </Link>
  );
}

export function HeaderFrame({
  items,
  mobileItems,
  logo,
  desktopNavLabel,
  mobileNavLabel,
  openMenuLabel,
  closeMenuLabel,
  mobileMeta,
  showSkipLink = false,
  skipLinkLabel,
  skipTargetId = "main-content",
  onSkipToContent,
  mainContentId = "main-content",
  footerId = "site-footer",
}: HeaderFrameProps) {
  const liteMotion = useLiteMotion();
  const isScrolled = useSyncExternalStore(
    subscribeScroll,
    getScrollSnapshot,
    getServerScrollSnapshot,
  );
  const [isTransitionReady, setIsTransitionReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);
  const isMobileOverlayActive = isMobileMenuOpen && !isDesktopViewport;
  const resolvedMobileItems = mobileItems ?? items;

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsTransitionReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

    const syncViewport = (matches: boolean) => {
      setIsDesktopViewport(matches);

      if (matches) {
        setIsMobileMenuOpen(false);
      }
    };

    syncViewport(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncViewport(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const mainContent = document.getElementById(mainContentId);
    const siteFooter = document.getElementById(footerId);

    document.body.style.overflow = isMobileOverlayActive ? "hidden" : "unset";

    if (isMobileOverlayActive) {
      mainContent?.setAttribute("inert", "");
      siteFooter?.setAttribute("inert", "");
      queueMicrotask(() => firstMobileLinkRef.current?.focus());
    } else {
      mainContent?.removeAttribute("inert");
      siteFooter?.removeAttribute("inert");
    }

    return () => {
      document.body.style.overflow = "unset";
      mainContent?.removeAttribute("inert");
      siteFooter?.removeAttribute("inert");
    };
  }, [footerId, isMobileOverlayActive, mainContentId]);

  useEffect(() => {
    const enableKeyboardNavigation = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setIsKeyboardNavigation(true);
      }
    };

    const disableKeyboardNavigation = () => {
      setIsKeyboardNavigation(false);
    };

    document.addEventListener("keydown", enableKeyboardNavigation);
    document.addEventListener("mousedown", disableKeyboardNavigation);
    document.addEventListener("touchstart", disableKeyboardNavigation);
    document.addEventListener("pointerdown", disableKeyboardNavigation);

    return () => {
      document.removeEventListener("keydown", enableKeyboardNavigation);
      document.removeEventListener("mousedown", disableKeyboardNavigation);
      document.removeEventListener("touchstart", disableKeyboardNavigation);
      document.removeEventListener("pointerdown", disableKeyboardNavigation);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        queueMicrotask(() => menuButtonRef.current?.focus());
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleSkipToContent = () => {
    requestAnimationFrame(() => {
      if (onSkipToContent) {
        onSkipToContent();
        return;
      }

      document.getElementById(skipTargetId)?.focus();
    });
  };

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50"
      data-keyboard-nav={isKeyboardNavigation ? "true" : "false"}
    >
      {showSkipLink && skipLinkLabel ? (
        <a href={`#${skipTargetId}`} onClick={handleSkipToContent} className="skip-link">
          {skipLinkLabel}
        </a>
      ) : null}

      <div
        className={cn(
          "relative z-[60] border-b py-4",
          isTransitionReady && "transition-all duration-500",
          isMobileOverlayActive
            ? "border-transparent bg-bg-primary py-4 shadow-none backdrop-blur-none"
            : isScrolled
              ? liteMotion
                ? "border-accent/18 bg-bg-primary shadow-lg lg:bg-bg-primary/96"
                : "border-accent/18 bg-bg-primary shadow-lg lg:bg-bg-primary/80 lg:backdrop-blur-2xl"
              : liteMotion
                ? "border-transparent bg-bg-primary lg:bg-bg-primary/92"
                : "border-transparent bg-bg-primary lg:bg-bg-primary/20 lg:backdrop-blur-md",
        )}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-6">
          {renderHeaderLink({
            item: logo,
            className: cn(
              "heading-serif justify-self-start shrink-0 rounded-sm text-xl text-text-primary transition-colors hover:text-accent md:text-2xl",
              FOCUS_RING_CLASS,
            ),
            children: (
              <>
                M<span className="text-accent italic">&</span>D
              </>
            ),
          })}

          <nav
            aria-label={desktopNavLabel}
            className="hidden items-center justify-self-center gap-8 lg:flex"
          >
            {items.map((item) => (
              <div key={`${item.kind}-${item.href}`} className="contents">
                {renderHeaderLink({
                  item,
                  className: cn(
                    "group relative rounded-sm px-1 py-2 text-xs font-medium uppercase tracking-widest transition-colors",
                    item.active ? "text-text-primary" : "text-text-secondary hover:text-accent",
                    FOCUS_RING_CLASS,
                  ),
                  children: (
                    <>
                      {item.label}
                      <span
                        className={cn(
                          "pointer-events-none absolute bottom-0 left-1 right-1 h-px origin-left bg-accent transition-transform duration-300",
                          item.active
                            ? "scale-x-100"
                            : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100",
                        )}
                      />
                    </>
                  ),
                })}
              </div>
            ))}
          </nav>

          <div className="hidden justify-self-end lg:flex lg:items-center lg:gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>

          <div className="col-start-3 flex items-center justify-self-end gap-3 lg:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <div className="mx-1 h-4 w-px bg-accent/30" />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className={cn(
                "flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full",
                FOCUS_RING_CLASS,
              )}
              aria-label={isMobileMenuOpen ? closeMenuLabel : openMenuLabel}
              aria-controls="mobile-navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <motion.span
                animate={isMobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className="h-0.5 w-6 rounded-full bg-accent"
              />
              <motion.span
                animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="h-0.5 w-6 rounded-full bg-accent"
              />
              <motion.span
                animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="h-0.5 w-6 rounded-full bg-accent"
              />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileOverlayActive ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed inset-0 z-50 overflow-hidden bg-bg-primary lg:hidden",
              !liteMotion && "backdrop-blur-2xl",
            )}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 overflow-hidden"
            >
              <span className="font-vibes block translate-x-6 translate-y-4 whitespace-nowrap text-[52vw] leading-none text-accent/6">
                M &amp; D
              </span>
            </div>

            <Ornament position="top-right" size="lg" className="opacity-[0.07]" />
            <Ornament position="bottom-left" size="sm" className="opacity-[0.05]" />

            <nav
              id="mobile-navigation"
              aria-label={mobileNavLabel}
              className="flex h-full flex-col justify-center px-8 pb-24 pt-16"
            >
              {resolvedMobileItems.map((item, index) => (
                <motion.div
                  key={`${item.kind}-${item.href}`}
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{
                    delay: 0.05 + index * 0.07,
                    duration: 0.45,
                    ease: MOTION_EASE,
                  }}
                  className="group border-b border-accent/18 last:border-0"
                >
                  {renderHeaderLink({
                    item,
                    className: cn(
                      "flex items-center gap-4 rounded-sm py-[0.9rem]",
                      FOCUS_RING_CLASS,
                    ),
                    onAfterSelect: () => setIsMobileMenuOpen(false),
                    ref: index === 0 ? firstMobileLinkRef : undefined,
                    children: (
                      <>
                        <span className="mt-0.5 w-5 shrink-0 font-cinzel text-[9px] tracking-widest text-accent">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "heading-serif text-[1.7rem] leading-none transition-colors duration-300",
                            item.active
                              ? "text-accent"
                              : "text-text-primary group-hover:text-accent group-focus-visible:text-accent",
                          )}
                        >
                          {item.label}
                        </span>
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          whileHover={{ opacity: 1, x: 0 }}
                          className="ml-auto text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </motion.span>
                      </>
                    ),
                  })}
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="absolute bottom-8 left-8 right-8 flex items-center justify-between"
            >
              <span className="font-cinzel text-[8px] uppercase tracking-[0.3em] text-text-secondary/90">
                {mobileMeta.left}
              </span>
              <span className="font-cinzel text-[8px] uppercase tracking-[0.3em] text-text-secondary/90">
                {mobileMeta.right}
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
