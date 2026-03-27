import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RsvpActionRow } from "./RsvpActionRow";

const meta = {
  title: "Features/RSVP/RsvpActionRow",
  component: RsvpActionRow,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof RsvpActionRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  args: {
    disabled: false,
    isSubmitting: false,
    liteMotion: false,
    submitLabel: "Підтвердити",
    loadingLabel: "Надсилаємо...",
    statusMessage: "Ваша відповідь буде збережена локально в mock-first фазі.",
  },
  render: (args) => (
    <div className="w-[min(28rem,92vw)] bg-bg-primary p-6">
      <RsvpActionRow {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    isSubmitting: false,
    liteMotion: false,
    submitLabel: "Підтвердити",
    loadingLabel: "Надсилаємо...",
    statusMessage: "Спочатку оберіть, чи будете ви присутні.",
  },
  render: Ready.render,
};
