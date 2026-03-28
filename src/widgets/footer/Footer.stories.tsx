import { StorybookFullscreenCanvas } from "@/testing/storybook/canvas";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Footer } from "./Footer";

const meta = {
  title: "Widgets/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  globals: {
    motion: "reduce",
  },
  render: () => (
    <StorybookFullscreenCanvas className="pt-24">
      <main id="main-content">
        <section id="our-story" />
        <section id="timeline" />
        <section id="location" />
        <section id="dress-code" />
        <section id="gifts" />
        <section id="rsvp" />
      </main>
      <Footer />
    </StorybookFullscreenCanvas>
  ),
};
