import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeedStatePanel } from "./FeedStatePanel";

const meta = {
  title: "Widgets/Activity Feed/FeedStatePanel",
  component: FeedStatePanel,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FeedStatePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="w-[min(42rem,92vw)] bg-bg-primary p-6">
      <FeedStatePanel>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <p className="surface-panel-label">Live moments</p>
          <h3 className="heading-serif text-4xl text-text-primary">Connection lost</h3>
          <p className="max-w-md text-sm leading-relaxed text-text-secondary">
            Canonical state shell for loading, empty and error states in the live projector.
          </p>
        </div>
      </FeedStatePanel>
    </div>
  ),
};
