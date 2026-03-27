import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeading } from "./SectionHeading";

const meta = {
  title: "Shared UI/SectionHeading",
  component: SectionHeading,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Розклад Дня",
  },
  render: () => (
    <div className="w-[min(44rem,92vw)] bg-bg-primary p-8">
      <SectionHeading subtitle="Як пройде наше свято">Розклад Дня</SectionHeading>
    </div>
  ),
};

export const WithEyebrow: Story = {
  args: {
    children: "RSVP",
  },
  render: () => (
    <div className="w-[min(44rem,92vw)] bg-bg-primary p-8">
      <SectionHeading eyebrow="Invitation" subtitle="Canonical section intro pattern">
        RSVP
      </SectionHeading>
    </div>
  ),
};
