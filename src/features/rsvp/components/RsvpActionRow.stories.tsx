import { StorybookCenteredCanvas } from "@/testing/storybook/canvas";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RsvpActionRow } from "./RsvpActionRow";

const meta = {
  title: "Features/RSVP/RsvpActionRow",
  component: RsvpActionRow,
  argTypes: {
    errorMessage: {
      control: "text",
    },
  },
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
    liteMotion: true,
    submitLabel: "Підтвердити",
    loadingLabel: "Надсилаємо...",
    statusMessage: "Ваша відповідь буде збережена локально в mock-first фазі.",
  },
  globals: {
    motion: "reduce",
  },
  render: (args) => (
    <StorybookCenteredCanvas widthClassName="w-[min(28rem,92vw)]">
      <RsvpActionRow {...args} />
    </StorybookCenteredCanvas>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    isSubmitting: false,
    liteMotion: true,
    submitLabel: "Підтвердити",
    loadingLabel: "Надсилаємо...",
    statusMessage: "Спочатку оберіть, чи будете ви присутні.",
  },
  render: Ready.render,
};
