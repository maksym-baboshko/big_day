import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvitationHeroIntro } from "./InvitationHeroIntro";

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
  render: () => (
    <div className="flex min-h-screen flex-col items-center justify-between bg-bg-primary py-12 md:pb-8 md:pt-24">
      <div className="h-12 flex-none md:h-24" />
      <InvitationHeroIntro />
    </div>
  ),
};
