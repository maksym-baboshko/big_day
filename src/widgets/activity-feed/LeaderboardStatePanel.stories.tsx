import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LeaderboardStatePanel } from "./LeaderboardStatePanel";

const meta = {
  title: "Widgets/Activity Feed/LeaderboardStatePanel",
  component: LeaderboardStatePanel,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LeaderboardStatePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    variant: "loading",
  },
  render: (args) => (
    <div className="w-[min(28rem,92vw)] bg-bg-primary p-6">
      <LeaderboardStatePanel {...args} />
    </div>
  ),
};

export const ErrorState: Story = {
  args: {
    variant: "error",
  },
  render: Loading.render,
};
