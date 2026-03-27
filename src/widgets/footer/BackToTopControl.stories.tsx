import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BackToTopControl } from "./BackToTopControl";

const meta = {
  title: "Widgets/Footer/BackToTopControl",
  component: BackToTopControl,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof BackToTopControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Наверх",
  },
  render: (args) => (
    <div className="bg-bg-secondary p-8">
      <BackToTopControl {...args} />
    </div>
  ),
};
