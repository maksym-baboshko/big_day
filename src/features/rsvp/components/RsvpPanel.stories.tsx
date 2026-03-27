import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RsvpPanel } from "./RsvpPanel";

const meta = {
  title: "Features/RSVP/RsvpPanel",
  component: RsvpPanel,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof RsvpPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="w-[min(42rem,92vw)] bg-bg-primary p-8">
      <RsvpPanel>
        <p className="surface-panel-label">RSVP</p>
        <h3 className="heading-serif mt-4 text-3xl text-text-primary">Canonical RSVP panel</h3>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          This is the canonical invitation surface language for interactive form-heavy blocks.
        </p>
      </RsvpPanel>
    </div>
  ),
};
