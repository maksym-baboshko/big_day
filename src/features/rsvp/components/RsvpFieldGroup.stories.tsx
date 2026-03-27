import { Input } from "@/shared/ui";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RsvpFieldGroup } from "./RsvpFieldGroup";

const meta = {
  title: "Features/RSVP/RsvpFieldGroup",
  component: RsvpFieldGroup,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof RsvpFieldGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
    title: "Імʼя",
  },
  render: () => (
    <div className="w-[min(32rem,92vw)] bg-bg-primary p-6">
      <RsvpFieldGroup
        as="div"
        title="Імʼя"
        titleAs="label"
        htmlFor="storybook-rsvp-name"
        required
        hint="Це канонічний field-group для RSVP поверхонь."
      >
        <Input id="storybook-rsvp-name" placeholder="Ваше імʼя" className="rounded-2xl py-4" />
      </RsvpFieldGroup>
    </div>
  ),
};
