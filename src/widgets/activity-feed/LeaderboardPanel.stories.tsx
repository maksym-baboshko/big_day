import { MOCK_POPULATED_ACTIVITY_FEED_SNAPSHOT } from "@/entities/event";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { LeaderboardRow } from "./LeaderboardRow";

const meta = {
  title: "Widgets/Activity Feed/LeaderboardPanel",
  component: LeaderboardPanel,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LeaderboardPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    children: null,
    eyebrow: "Leaderboard rankings",
  },
  render: () => (
    <div className="w-[min(28rem,92vw)] bg-bg-primary p-6">
      <LeaderboardPanel eyebrow="Leaderboard rankings">
        <div className="grid gap-3">
          {MOCK_POPULATED_ACTIVITY_FEED_SNAPSHOT.leaderboard.slice(0, 4).map((entry) => (
            <LeaderboardRow key={entry.playerId} entry={entry} isLeader={entry.rank === 1} />
          ))}
        </div>
      </LeaderboardPanel>
    </div>
  ),
};
