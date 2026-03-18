"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Button, Input } from "@/shared/ui";
import { cn } from "@/shared/lib";
import type { GameApiErrorCode, PlayerSessionSnapshot } from "./types";

function DecorativeBurst({ className }: { className?: string }) {
  const rays = 12;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i * 360) / rays - 90;
        const rad = (angle * Math.PI) / 180;
        const inner = 8;
        const outer = 48;
        const x1 = 50 + inner * Math.cos(rad);
        const y1 = 50 + inner * Math.sin(rad);
        const x2 = 50 + outer * Math.cos(rad);
        const y2 = 50 + outer * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={i % 2 === 0 ? "0.8" : "0.4"}
            opacity={i % 2 === 0 ? 0.1 : 0.05}
          />
        );
      })}
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity={0.08} />
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.3" opacity={0.05} />
      <circle cx="50" cy="50" r="6" fill="currentColor" opacity={0.06} />
    </svg>
  );
}

function CardShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative rounded-4xl bg-accent/10 p-px", className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-4xl">
        <motion.div
          className="absolute left-1/2 top-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2"
          style={{
            backgroundImage:
              "conic-gradient(from 0deg, transparent 60%, var(--accent) 88%, transparent 94%)",
            opacity: 0.6,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {children}
    </div>
  );
}

interface PlayerSessionCardProps {
  session: PlayerSessionSnapshot | null;
  isHydrating: boolean;
  isSaving: boolean;
  errorCode: GameApiErrorCode | null;
  onSave: (nickname: string) => Promise<PlayerSessionSnapshot | null>;
  onClear: () => void | Promise<void>;
  compact?: boolean;
  className?: string;
}

function resolveErrorMessage(
  errorCode: GameApiErrorCode | null,
  t: ReturnType<typeof useTranslations>
) {
  if (!errorCode) return null;
  if (errorCode === "SUPABASE_NOT_CONFIGURED") return t("errors.storage_unavailable");
  if (errorCode === "PLAYER_NOT_FOUND") return t("errors.session_missing");
  if (errorCode === "UNAUTHORIZED") return t("errors.session_missing");
  if (errorCode === "RATE_LIMITED") return t("errors.rate_limited");
  return t("errors.generic");
}

export function PlayerSessionCard({
  session,
  isHydrating,
  isSaving,
  errorCode,
  onSave,
  onClear,
  compact = false,
  className,
}: PlayerSessionCardProps) {
  const t = useTranslations("GamesSession");
  const [nickname, setNickname] = useState(session?.nickname ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const errorMessage = resolveErrorMessage(errorCode, t);
  const isSummaryVisible = session && !isEditing;
  const normalizedNickname = nickname.trim().replace(/\s+/g, " ");
  const normalizedSessionNickname = session
    ? session.nickname.trim().replace(/\s+/g, " ")
    : null;
  const isUnchangedEdit =
    Boolean(session) && normalizedNickname === normalizedSessionNickname;

  const cardClass = cn(
    "relative overflow-hidden rounded-[31px] bg-bg-primary p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.45)] md:p-7",
    !compact && "h-[285px]",
    compact && "p-5 md:p-6"
  );

  const chrome = (
    <div className="pointer-events-none absolute -right-8 top-8 h-24 w-24 rounded-full bg-accent/8 blur-3xl" />
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (session && isUnchangedEdit) {
      setNickname(session.nickname);
      setIsEditing(false);
      return;
    }

    const saved = await onSave(normalizedNickname);
    if (saved) {
      setNickname(saved.nickname);
      setIsEditing(false);
    }
  }

  /* ── Skeleton ── */
  if (isHydrating) {
    return (
      <CardShell className={className}>
        <div className={cardClass}>
          {chrome}
          <div className="relative z-10 flex h-full flex-col justify-between animate-pulse">
            {/* Top: small label + subtitle text */}
            <div className="space-y-2">
              <div className="h-2.5 w-20 rounded-full bg-accent/20" />
              <div className="h-4 w-52 rounded-full bg-accent/12" />
            </div>
            {/* Middle: input + helper */}
            <div>
              <div className="h-13 rounded-2xl bg-accent/8" />
              <div className="mt-2 h-3 w-44 rounded-full bg-accent/6" />
            </div>
            {/* Bottom: full-width button */}
            <div className="h-14 w-full rounded-full bg-accent/12" />
          </div>
        </div>
      </CardShell>
    );
  }

  /* ── Filled state ── */
  if (isSummaryVisible) {
    return (
      <CardShell className={className}>
        <div className={cardClass}>
          {chrome}
          {/* Decorative animated burst */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[31px]">
            <motion.div
              className="absolute -right-6 top-1/2 h-56 w-56 -translate-y-1/2 text-accent md:right-2 md:h-64 md:w-64"
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            >
              <DecorativeBurst className="h-full w-full" />
            </motion.div>
          </div>
          <div className="relative z-10 flex h-full flex-col">
            {/* Identity + points — centered between top and "Інший гравець" */}
            <div className="flex flex-1 items-center -mt-2">
              <div className="flex w-full items-end justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-accent">
                    {t("playing_as_label")}
                  </p>
                  <h2
                    className={cn(
                      "heading-serif mt-3 truncate text-[2.75rem] leading-[0.92] tracking-[0.04em] text-text-primary",
                      compact && "text-3xl"
                    )}
                    title={session.nickname}
                  >
                    {session.nickname}
                  </h2>
                </div>
                <div className="shrink-0 flex flex-col items-center">
                  <p
                    className={cn(
                      "font-cinzel text-[42px] leading-none text-text-primary",
                      compact && "text-3xl"
                    )}
                  >
                    {session.totalPoints}
                  </p>
                  <p className="mt-2.5 text-[11px] uppercase tracking-[0.22em] text-accent/50">
                    {t("points_label", { points: session.totalPoints })}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom: actions */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setNickname(session.nickname);
                  setIsEditing(true);
                }}
                className="w-full cursor-pointer rounded-full border border-accent/20 bg-accent/10 px-8 py-4 text-lg font-medium text-text-primary transition-all duration-300 hover:border-accent/35 hover:bg-accent/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              >
                {t("edit_cta")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void onClear();
                  setNickname("");
                  setIsEditing(false);
                }}
                className="cursor-pointer text-[11px] uppercase tracking-[0.2em] text-text-secondary/60 transition-colors duration-300 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t("reset_cta")}
              </button>
            </div>
          </div>
        </div>
      </CardShell>
    );
  }

  /* ── Empty + Edit states (form) ── */
  return (
    <CardShell className={className}>
      <div className={cardClass}>
        {chrome}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 flex h-full flex-col justify-between"
        >
          {/* Top: header */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-accent">
              {session ? t("edit_label") : t("new_label")}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              {session ? t("edit_note") : t("new_title")}
            </p>
          </div>

          {/* Middle: input + helper */}
          <div>
            <Input
              id="player-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t("nickname_placeholder")}
              minLength={2}
              maxLength={40}
              autoComplete="nickname"
              autoFocus
              disabled={isSaving}
              aria-label={t("nickname_label")}
              className="h-13 rounded-2xl px-5 text-base"
            />
            {!session && (
              <p
                className={cn(
                  "mt-2 pl-3.75 text-xs leading-relaxed",
                  errorMessage ? "text-text-secondary" : "text-text-secondary/50"
                )}
              >
                {errorMessage ?? t("device_hint")}
              </p>
            )}
            {session && errorMessage && (
              <p className="mt-2 pl-3.75 text-xs leading-relaxed text-text-secondary">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Bottom: actions */}
          <div className="flex flex-col items-center gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={
                isSaving || normalizedNickname.length < 2 || isUnchangedEdit
              }
              className="w-full"
            >
              {isSaving
                ? t("saving_cta")
                : session
                  ? t("update_cta")
                  : t("save_cta")}
            </Button>
            {session ? (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setNickname(session.nickname);
                }}
                className="cursor-pointer text-[11px] uppercase tracking-[0.2em] text-text-secondary/60 transition-colors duration-300 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t("cancel_cta")}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </CardShell>
  );
}
