import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FooterNavCluster } from "./FooterNavCluster";

const meta = {
  title: "Widgets/Footer/FooterNavCluster",
  component: FooterNavCluster,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FooterNavCluster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ariaLabel: "Footer navigation",
    items: [
      { href: "#our-story", label: "Історія" },
      { href: "#timeline", label: "Розклад" },
      { href: "#location", label: "Локація" },
      { href: "#dress-code", label: "Дрес-код" },
      { href: "#gifts", label: "Подарунки" },
      { href: "#rsvp", label: "RSVP" },
    ],
  },
  render: (args) => (
    <div className="w-[min(44rem,92vw)] bg-bg-secondary p-6">
      <FooterNavCluster {...args} />
    </div>
  ),
};
