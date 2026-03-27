import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FooterSignatureBlock } from "./FooterSignatureBlock";

const meta = {
  title: "Widgets/Footer/FooterSignatureBlock",
  component: FooterSignatureBlock,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FooterSignatureBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    venueLabel: "Bergen · Norway",
    groomName: "Максим",
    brideName: "Діана",
    romanDate: "XXVIII · VI · MMXXVI",
    venueName: "Grand Hotel Terminus",
  },
  render: (args) => (
    <div className="flex min-h-[26rem] flex-col items-center justify-center gap-10 bg-bg-secondary px-6 py-12">
      <FooterSignatureBlock {...args} />
    </div>
  ),
};
