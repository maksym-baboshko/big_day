import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeading } from "./SectionHeading";
import { SectionShell } from "./SectionShell";

const meta = {
  title: "Shared UI/SectionShell",
  component: SectionShell,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SectionShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WideSecondary: Story = {
  args: {
    children: null,
  },
  render: () => (
    <SectionShell background="secondary" contentWidth="wide" className="min-h-[36rem]">
      <SectionHeading eyebrow="Section shell" subtitle="Outer rhythm, spacing and background mode">
        Canonical invitation section
      </SectionHeading>
      <div className="rounded-[var(--surface-radius-card)] border border-accent/12 bg-bg-primary/50 px-6 py-8">
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
          Use SectionShell as the outer section rhythm layer instead of repeating width, padding,
          fade and background recipes in every widget.
        </p>
      </div>
    </SectionShell>
  ),
};
