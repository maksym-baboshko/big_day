"use client";

import { Ornament, SectionHeading, SectionShell } from "@/shared/ui";
import { useTranslations } from "next-intl";
import { TimelineRail, type TimelineRailEvent } from "./TimelineRail";

export function Timeline() {
  const t = useTranslations("Timeline");

  const eventKeys = ["ceremony", "photo_session", "banquet", "activities", "cake", "sparklers"];
  const events: TimelineRailEvent[] = eventKeys.map((key) => ({
    id: key,
    time: t(`events.${key}.time`),
    title: t(`events.${key}.title`),
    description: t(`events.${key}.description`),
  }));

  return (
    <SectionShell
      id="timeline"
      background="primary"
      contentWidth="wide"
      className="relative overflow-hidden"
    >
      <Ornament position="top-right" size="sm" />
      <Ornament position="bottom-left" size="sm" />

      <SectionHeading subtitle={t("subtitle")}>{t("title")}</SectionHeading>
      <TimelineRail events={events} />
    </SectionShell>
  );
}
