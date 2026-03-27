import { MOCK_POPULATED_ACTIVITY_FEED_SNAPSHOT } from "@/entities/event";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeedEventCard } from "./FeedEventCard";

const promptEvent = MOCK_POPULATED_ACTIVITY_FEED_SNAPSHOT.feed[0];

if (!promptEvent) {
  throw new Error("Expected at least one populated feed event for Storybook.");
}

const systemEvent =
  MOCK_POPULATED_ACTIVITY_FEED_SNAPSHOT.feed.find((event) => !event.promptI18n) ?? promptEvent;

const meta = {
  title: "Widgets/Activity Feed/FeedEventCard",
  component: FeedEventCard,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FeedEventCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PromptEvent: Story = {
  args: {
    event: promptEvent,
  },
  render: (args) => (
    <div className="w-[min(34rem,92vw)] bg-bg-primary p-6">
      <FeedEventCard {...args} />
    </div>
  ),
};

export const SystemEvent: Story = {
  args: {
    event: systemEvent,
  },
  render: PromptEvent.render,
};
