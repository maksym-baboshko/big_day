import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarHeart } from "lucide-react";
import { TimelineItemCard } from "./TimelineItemCard";

const meta = {
  title: "Widgets/Timeline/TimelineItemCard",
  component: TimelineItemCard,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TimelineItemCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <CalendarHeart className="h-4 w-4" />,
    title: "Весільна церемонія",
    description:
      "Канонічна картка для таймлайну з єдиною panel language, заголовком і підтримкою довшого опису.",
  },
  render: (args) => (
    <div className="w-[min(32rem,92vw)] bg-bg-primary p-6">
      <TimelineItemCard {...args} />
    </div>
  ),
};
