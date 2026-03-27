import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InvitationSummaryCard } from "./InvitationSummaryCard";

const meta = {
  title: "Widgets/Personal Invitation/InvitationSummaryCard",
  component: InvitationSummaryCard,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof InvitationSummaryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Subtle: Story = {
  args: {
    label: "SEATS",
    title: (
      <div className="flex items-end gap-3">
        <span className="font-cinzel text-6xl leading-none text-bg-primary dark:text-text-primary">
          2
        </span>
        <span className="pb-2 text-sm uppercase tracking-[0.22em] text-bg-primary/55 dark:text-text-secondary">
          seats
        </span>
      </div>
    ),
    description:
      "Use this surface for personalized invitation metadata without introducing another card language.",
  },
  render: (args) => (
    <div className="w-[min(26rem,92vw)] bg-bg-primary p-6">
      <InvitationSummaryCard {...args} />
    </div>
  ),
};

export const Highlighted: Story = {
  args: {
    label: "DETAILS",
    title: (
      <div className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-bg-primary/45 dark:text-text-secondary/80">
            Date
          </p>
          <p className="heading-serif mt-1 text-xl text-bg-primary dark:text-text-primary">
            28 June 2026
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-bg-primary/45 dark:text-text-secondary/80">
            Venue
          </p>
          <p className="heading-serif mt-1 text-xl text-bg-primary dark:text-text-primary">
            Grand Hotel Terminus
          </p>
        </div>
      </div>
    ),
    description: "Highlighted variant for denser invitation summary cards.",
    tone: "highlighted",
  },
  render: (args) => (
    <div className="w-[min(26rem,92vw)] bg-bg-primary p-6">
      <InvitationSummaryCard {...args} />
    </div>
  ),
};
