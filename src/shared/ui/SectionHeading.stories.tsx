import { StorybookCenteredCanvas } from "@/testing/storybook/canvas";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeading } from "./SectionHeading";

const meta = {
  title: "Shared UI/SectionHeading",
  component: SectionHeading,
  args: {
    children: "Розклад Дня",
    subtitle: "Як пройде наше свято",
  },
  argTypes: {
    children: {
      control: "text",
    },
    eyebrow: {
      control: "text",
    },
    subtitle: {
      control: "text",
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

const stableVisualGlobals = {
  motion: "reduce",
} as const;

export const Default: Story = {
  globals: stableVisualGlobals,
  render: (args) => (
    <StorybookCenteredCanvas widthClassName="w-[min(44rem,92vw)]" paddingClassName="p-8">
      <SectionHeading eyebrow={args.eyebrow} subtitle={args.subtitle}>
        {args.children}
      </SectionHeading>
    </StorybookCenteredCanvas>
  ),
};

export const WithEyebrow: Story = {
  args: {
    children: "RSVP",
    eyebrow: "Invitation",
    subtitle: "Canonical section intro pattern",
  },
  globals: stableVisualGlobals,
  render: Default.render,
};
