import { StorybookFullscreenCanvas } from "@/testing/storybook/canvas";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvitationHeroIntro } from "./InvitationHeroIntro";

const STORYBOOK_FIXED_NOW = Date.UTC(2026, 2, 1, 12, 0, 0);

const meta = {
  title: "Widgets/Hero/InvitationHeroIntro",
  component: InvitationHeroIntro,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof InvitationHeroIntro>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  globals: {
    motion: "reduce",
  },
  render: () => (
    <StorybookFullscreenCanvas className="flex min-h-screen flex-col items-center justify-between py-12 md:pb-8 md:pt-24">
      <div className="h-12 flex-none md:h-24" />
      <InvitationHeroIntro countdownNowMs={STORYBOOK_FIXED_NOW} />
    </StorybookFullscreenCanvas>
  ),
};
